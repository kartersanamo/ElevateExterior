export interface TemplateVars {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date?: string;
  time?: string;
  services?: string;
}

export function renderTemplate(
  template: string,
  vars: TemplateVars
): string {
  return template
    .replace(/\{\{name\}\}/g, vars.name ?? "")
    .replace(/\{\{email\}\}/g, vars.email ?? "")
    .replace(/\{\{phone\}\}/g, vars.phone ?? "")
    .replace(/\{\{address\}\}/g, vars.address ?? "")
    .replace(/\{\{date\}\}/g, vars.date ?? "")
    .replace(/\{\{time\}\}/g, vars.time ?? "")
    .replace(/\{\{services\}\}/g, vars.services ?? "");
}
