// Scaffolds a service in app/services, shaped like the existing ones (see subjectService.ts).
// Usage: npm run make:service <Name> [apiPath]
//   npm run make:service Fine               -> app/services/fineService.ts, endpoints under /fines
//   npm run make:service Fine librarian/fines
// (Leave off the leading slash: Git Bash rewrites "/librarian/..." into a Windows path.)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [rawName, rawPath] = process.argv.slice(2)

if (!rawName || !/^[A-Za-z][A-Za-z0-9]*$/.test(rawName)) {
	console.error('Usage: npm run make:service <Name> [apiPath]   (Name: letters and digits, e.g. Fine or BookLoan)')
	process.exit(1)
}

// "BookLoan", "bookLoan" and "bookLoanService" all give the same file.
const base = rawName.replace(/Service$/i, '')
const pascal = base.charAt(0).toUpperCase() + base.slice(1)
const camel = base.charAt(0).toLowerCase() + base.slice(1)
const kebab = camel.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
if (rawPath && /[:\\]/.test(rawPath)) {
	console.error(`"${rawPath}" looks like a file path, not an API path. Pass it without the leading slash, e.g. librarian/fines`)
	process.exit(1)
}
const apiPath = rawPath ? '/' + rawPath.replace(/^\/+|\/+$/g, '') : `/${kebab}s`

const file = path.join(root, 'app', 'services', `${camel}Service.ts`)
if (fs.existsSync(file)) {
	console.error(`app/services/${camel}Service.ts already exists; nothing written.`)
	process.exit(1)
}

const template = `import { BaseService } from "./BaseService";

// TODO: match the fields the Laravel resource actually returns.
export interface ${pascal}Record {
  ${camel}ID: number;
}

export type ${pascal}Payload = Omit<${pascal}Record, "${camel}ID">;

class ${pascal}ServiceClass extends BaseService {
  fetch${pascal}s(query: Record<string, unknown> = {}) {
    return this.apiRequest<{ ${camel}s: ${pascal}Record[] }>("${apiPath}", { query });
  }

  create${pascal}(payload: ${pascal}Payload) {
    return this.apiRequest<{ message: string; ${camel}: ${pascal}Record }>("${apiPath}", { method: "POST", body: payload });
  }

  update${pascal}(${camel}ID: number, payload: Partial<${pascal}Payload>) {
    return this.apiRequest<{ message: string; ${camel}: ${pascal}Record }>(\`${apiPath}/\${${camel}ID}\`, { method: "PATCH", body: payload });
  }

  delete${pascal}(${camel}ID: number) {
    return this.apiRequest<{ message: string }>(\`${apiPath}/\${${camel}ID}\`, { method: "DELETE" });
  }
}

export const ${camel}Service = new ${pascal}ServiceClass();
`

fs.writeFileSync(file, template)
console.log(`Created app/services/${camel}Service.ts (endpoints under ${apiPath})`)
console.log(`Import it with: import { ${camel}Service } from '~/services/${camel}Service'`)
