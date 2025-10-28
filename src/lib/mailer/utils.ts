import { readFile } from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';

export async function renderTemplate(
  templateName: string,
  data: Record<string, unknown>,
): Promise<string> {
  const filePath = path.join(
    process.cwd(),
    'src',
    'lib',
    'auth',
    'emails',
    `${templateName}.html`,
  );
  const raw = await readFile(filePath, 'utf-8');
  const tpl = Handlebars.compile(raw);
  return tpl(data);
}
