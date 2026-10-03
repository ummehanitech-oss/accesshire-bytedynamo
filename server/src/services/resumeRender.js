import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import PDFDocument from 'pdfkit';
import { MAX_LENGTHS } from '../profileSchema.js';

/**
 * Format a safe, sanitized file name for resume attachment downloads.
 * Strips any characters outside letters, numbers, dash, and underscore.
 */
export function formatResumeFileName(fullName, format = 'docx') {
  const cleanName = (fullName || 'Candidate')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/-+/g, '-');

  const ext = format === 'pdf' ? 'pdf' : 'docx';
  return `Resume-${cleanName || 'Candidate'}.${ext}`;
}

/**
 * Check if text contains non-Latin characters that standard PDF fonts (Helvetica) cannot render.
 */
export function hasUnsupportedPdfCharacters(text) {
  if (typeof text !== 'string') return false;
  // Standard WinAnsi / Latin-1 covers \u0000-\u00FF.
  // Allow common typographic symbols (dashes, quotes, bullets: \u2010-\u2026, \u2022).
  // Any character outside Latin-1 + basic typographic symbols is unsupported in standard Helvetica.
  return /[^\u0000-\u00FF\u2010-\u2026\u2022]/.test(text);
}

/**
 * Sanitize and validate resume structure for rendering, enforcing caps and dropping unknown data.
 */
export function sanitizeResumeForRender(input = {}) {
  const cleanStr = (val, max = 200) => (typeof val === 'string' ? val.trim().slice(0, max) : '');

  const fullName = cleanStr(input.fullName, MAX_LENGTHS.name);
  if (!fullName) {
    const err = new Error('Candidate full name is required to render a resume.');
    err.statusCode = 400;
    throw err;
  }

  const email = cleanStr(input.email, MAX_LENGTHS.name);
  if (!email) {
    const err = new Error('Candidate email address is required to render a resume.');
    err.statusCode = 400;
    throw err;
  }

  const links = input.links || {};
  const sanitizedLinks = {
    linkedin: cleanStr(links.linkedin, MAX_LENGTHS.url),
    github: cleanStr(links.github, MAX_LENGTHS.url),
    portfolio: cleanStr(links.portfolio, MAX_LENGTHS.url),
    other: Array.isArray(links.other)
      ? links.other.map(u => cleanStr(u, MAX_LENGTHS.url)).filter(Boolean).slice(0, 10)
      : []
  };

  const skills = Array.isArray(input.skills)
    ? input.skills.map(s => cleanStr(s, 100)).filter(Boolean).slice(0, MAX_LENGTHS.arrayMax)
    : [];

  const experience = Array.isArray(input.experience)
    ? input.experience.slice(0, MAX_LENGTHS.arrayMax).map(exp => {
        if (!exp || typeof exp !== 'object') return null;
        return {
          id: cleanStr(exp.id, 50),
          company: cleanStr(exp.company, MAX_LENGTHS.name),
          role: cleanStr(exp.role, MAX_LENGTHS.title),
          location: cleanStr(exp.location, MAX_LENGTHS.shortText),
          startDate: cleanStr(exp.startDate, 20),
          endDate: Boolean(exp.current) ? 'Present' : cleanStr(exp.endDate, 20),
          current: Boolean(exp.current),
          bullets: Array.isArray(exp.bullets)
            ? exp.bullets.map(b => cleanStr(b, MAX_LENGTHS.bullet)).filter(Boolean).slice(0, MAX_LENGTHS.bulletsMax)
            : []
        };
      }).filter(Boolean)
    : [];

  const projects = Array.isArray(input.projects)
    ? input.projects.slice(0, MAX_LENGTHS.arrayMax).map(prj => {
        if (!prj || typeof prj !== 'object') return null;
        return {
          id: cleanStr(prj.id, 50),
          name: cleanStr(prj.name, MAX_LENGTHS.name),
          description: cleanStr(prj.description, MAX_LENGTHS.description),
          technologies: Array.isArray(prj.technologies)
            ? prj.technologies.map(t => cleanStr(t, 50)).filter(Boolean).slice(0, 20)
            : [],
          link: cleanStr(prj.link, MAX_LENGTHS.url)
        };
      }).filter(Boolean)
    : [];

  const educationEntries = Array.isArray(input.educationEntries)
    ? input.educationEntries.slice(0, MAX_LENGTHS.arrayMax).map(ed => {
        if (!ed || typeof ed !== 'object') return null;
        return {
          id: cleanStr(ed.id, 50),
          degree: cleanStr(ed.degree, MAX_LENGTHS.name),
          institution: cleanStr(ed.institution, MAX_LENGTHS.name),
          year: cleanStr(ed.year, MAX_LENGTHS.year),
          details: cleanStr(ed.details, MAX_LENGTHS.bullet)
        };
      }).filter(Boolean)
    : [];

  const certifications = Array.isArray(input.certifications)
    ? input.certifications.slice(0, MAX_LENGTHS.arrayMax).map(crt => {
        if (!crt || typeof crt !== 'object') return null;
        return {
          id: cleanStr(crt.id, 50),
          name: cleanStr(crt.name, MAX_LENGTHS.name),
          issuer: cleanStr(crt.issuer, MAX_LENGTHS.name),
          year: cleanStr(crt.year, MAX_LENGTHS.year)
        };
      }).filter(Boolean)
    : [];

  const languages = Array.isArray(input.languages)
    ? input.languages.map(l => cleanStr(l, 50)).filter(Boolean).slice(0, 20)
    : [];

  return {
    fullName,
    email,
    phone: cleanStr(input.phone, MAX_LENGTHS.phone),
    location: cleanStr(input.location, MAX_LENGTHS.shortText),
    links: sanitizedLinks,
    summary: cleanStr(input.summary, MAX_LENGTHS.summary),
    skills,
    experience,
    projects,
    educationEntries,
    certifications,
    languages
  };
}

/**
 * Generate a DOCX resume buffer.
 * Single column, accessible headings, real list bullets, metadata.
 */
export async function renderResumeDocx(resume) {
  const children = [];

  // Title: Name (Heading 1)
  children.push(
    new Paragraph({
      text: resume.fullName,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 }
    })
  );

  // Contact info line
  const contactParts = [
    resume.email,
    resume.phone,
    resume.location,
    resume.links?.linkedin,
    resume.links?.github,
    resume.links?.portfolio
  ].filter(Boolean);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join('  •  '), size: 20 })],
        spacing: { after: 240 }
      })
    );
  }

  // Summary section
  if (resume.summary) {
    children.push(
      new Paragraph({
        text: 'Summary',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );
    children.push(
      new Paragraph({
        text: resume.summary,
        spacing: { after: 200 }
      })
    );
  }

  // Skills section
  if (resume.skills && resume.skills.length > 0) {
    children.push(
      new Paragraph({
        text: 'Skills',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );
    children.push(
      new Paragraph({
        text: resume.skills.join(', '),
        spacing: { after: 200 }
      })
    );
  }

  // Work Experience section
  if (resume.experience && resume.experience.length > 0) {
    children.push(
      new Paragraph({
        text: 'Work Experience',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );

    for (const exp of resume.experience) {
      const titleLine = `${exp.role || 'Role'} — ${exp.company || 'Company'}`;
      const dateLocLine = [
        exp.startDate ? `${exp.startDate} – ${exp.endDate || 'Present'}` : '',
        exp.location
      ].filter(Boolean).join(' | ');

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: titleLine, bold: true }),
            dateLocLine ? new TextRun({ text: ` (${dateLocLine})`, italics: true }) : new TextRun('')
          ],
          spacing: { before: 120, after: 60 }
        })
      );

      if (Array.isArray(exp.bullets)) {
        for (const bullet of exp.bullets) {
          if (!bullet) continue;
          children.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
              spacing: { after: 40 }
            })
          );
        }
      }
    }
  }

  // Projects section
  if (resume.projects && resume.projects.length > 0) {
    children.push(
      new Paragraph({
        text: 'Projects',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );

    for (const prj of resume.projects) {
      const techText = prj.technologies && prj.technologies.length > 0 ? ` [${prj.technologies.join(', ')}]` : '';
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: prj.name || 'Project', bold: true }),
            techText ? new TextRun({ text: techText, italics: true }) : new TextRun(''),
            prj.link ? new TextRun({ text: ` — ${prj.link}` }) : new TextRun('')
          ],
          spacing: { before: 120, after: 40 }
        })
      );

      if (prj.description) {
        children.push(
          new Paragraph({
            text: prj.description,
            spacing: { after: 120 }
          })
        );
      }
    }
  }

  // Education section
  if (resume.educationEntries && resume.educationEntries.length > 0) {
    children.push(
      new Paragraph({
        text: 'Education',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );

    for (const ed of resume.educationEntries) {
      const edLine = [ed.degree, ed.institution, ed.year].filter(Boolean).join(', ');
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edLine, bold: true }),
            ed.details ? new TextRun({ text: ` (${ed.details})` }) : new TextRun('')
          ],
          spacing: { before: 80, after: 60 }
        })
      );
    }
  }

  // Certifications section
  if (resume.certifications && resume.certifications.length > 0) {
    children.push(
      new Paragraph({
        text: 'Certifications',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );

    for (const cert of resume.certifications) {
      const certLine = [cert.name, cert.issuer, cert.year].filter(Boolean).join(' — ');
      children.push(
        new Paragraph({
          text: certLine,
          spacing: { before: 40, after: 40 }
        })
      );
    }
  }

  // Languages section
  if (resume.languages && resume.languages.length > 0) {
    children.push(
      new Paragraph({
        text: 'Languages',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );
    children.push(
      new Paragraph({
        text: resume.languages.join(', '),
        spacing: { after: 120 }
      })
    );
  }

  const doc = new Document({
    title: `Resume - ${resume.fullName}`,
    description: `Professional candidate resume for ${resume.fullName}`,
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generate a PDF resume buffer.
 * Single column, accessible text, document metadata, font safety check.
 */
export function renderResumePdf(resume) {
  // Check for characters that cannot be drawn with standard Helvetica
  const allText = [
    resume.fullName,
    resume.summary,
    (resume.skills || []).join(' '),
    (resume.experience || []).map(e => `${e.role} ${e.company} ${(e.bullets || []).join(' ')}`).join(' '),
    (resume.projects || []).map(p => `${p.name} ${p.description}`).join(' '),
    (resume.educationEntries || []).map(ed => `${ed.degree} ${ed.institution}`).join(' ')
  ].join(' ');

  if (hasUnsupportedPdfCharacters(allText)) {
    const err = new Error(
      'This resume contains non-Latin or complex characters that PDF standard fonts cannot display reliably. Please download your resume as a Word document (.docx) instead.'
    );
    err.statusCode = 422;
    throw err;
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Resume - ${resume.fullName}`,
          Author: resume.fullName,
          Subject: 'Candidate Resume',
          Keywords: (resume.skills || []).slice(0, 5).join(', ')
        },
        pdfVersion: '1.7'
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Header: Candidate Name
      doc.fontSize(20).font('Helvetica-Bold').text(resume.fullName, { align: 'left' });
      doc.moveDown(0.3);

      // Contact info
      const contactParts = [
        resume.email,
        resume.phone,
        resume.location,
        resume.links?.linkedin,
        resume.links?.github,
        resume.links?.portfolio
      ].filter(Boolean);

      if (contactParts.length > 0) {
        doc.fontSize(9.5).font('Helvetica').fillColor('#4b5563').text(contactParts.join('  |  '), { align: 'left' });
        doc.moveDown(0.8);
      }

      doc.fillColor('#111827');

      const addSectionHeading = (title) => {
        doc.moveDown(0.6);
        doc.fontSize(12).font('Helvetica-Bold').text(title.toUpperCase(), { underline: true });
        doc.moveDown(0.4);
      };

      // Summary
      if (resume.summary) {
        addSectionHeading('Summary');
        doc.fontSize(10).font('Helvetica').text(resume.summary, { lineGap: 2 });
      }

      // Skills
      if (resume.skills && resume.skills.length > 0) {
        addSectionHeading('Skills');
        doc.fontSize(10).font('Helvetica').text(resume.skills.join(', '), { lineGap: 2 });
      }

      // Experience
      if (resume.experience && resume.experience.length > 0) {
        addSectionHeading('Work Experience');

        for (const exp of resume.experience) {
          const titleLine = `${exp.role || 'Role'} — ${exp.company || 'Company'}`;
          const dateLocLine = [
            exp.startDate ? `${exp.startDate} - ${exp.endDate || 'Present'}` : '',
            exp.location
          ].filter(Boolean).join(' | ');

          doc.fontSize(10.5).font('Helvetica-Bold').text(titleLine);
          if (dateLocLine) {
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#4b5563').text(dateLocLine);
            doc.fillColor('#111827');
          }

          if (Array.isArray(exp.bullets)) {
            for (const bullet of exp.bullets) {
              if (!bullet) continue;
              doc.fontSize(9.5).font('Helvetica').text(`•  ${bullet}`, { indent: 12, lineGap: 1.5 });
            }
          }
          doc.moveDown(0.4);
        }
      }

      // Projects
      if (resume.projects && resume.projects.length > 0) {
        addSectionHeading('Projects');

        for (const prj of resume.projects) {
          const techText = prj.technologies && prj.technologies.length > 0 ? ` [${prj.technologies.join(', ')}]` : '';
          doc.fontSize(10.5).font('Helvetica-Bold').text(`${prj.name || 'Project'}${techText}`);
          if (prj.link) {
            doc.fontSize(9).font('Helvetica').fillColor('#2563eb').text(prj.link);
            doc.fillColor('#111827');
          }
          if (prj.description) {
            doc.fontSize(9.5).font('Helvetica').text(prj.description, { lineGap: 1.5 });
          }
          doc.moveDown(0.4);
        }
      }

      // Education
      if (resume.educationEntries && resume.educationEntries.length > 0) {
        addSectionHeading('Education');

        for (const ed of resume.educationEntries) {
          const line = [ed.degree, ed.institution, ed.year].filter(Boolean).join(', ');
          doc.fontSize(10).font('Helvetica-Bold').text(line);
          if (ed.details) {
            doc.fontSize(9).font('Helvetica').text(ed.details);
          }
          doc.moveDown(0.2);
        }
      }

      // Certifications
      if (resume.certifications && resume.certifications.length > 0) {
        addSectionHeading('Certifications');

        for (const cert of resume.certifications) {
          const line = [cert.name, cert.issuer, cert.year].filter(Boolean).join(' — ');
          doc.fontSize(9.5).font('Helvetica').text(line);
        }
      }

      // Languages
      if (resume.languages && resume.languages.length > 0) {
        addSectionHeading('Languages');
        doc.fontSize(9.5).font('Helvetica').text(resume.languages.join(', '));
      }

      doc.end();
    } catch (renderErr) {
      reject(renderErr);
    }
  });
}
