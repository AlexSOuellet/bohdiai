import type { ContactFormNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

const DEFAULT_FIELDS: NonNullable<ContactFormNode['fields']> = [
  { name: 'name', label: 'Name', kind: 'text', required: true },
  { name: 'email', label: 'Email', kind: 'email', required: true },
  { name: 'message', label: 'Message', kind: 'textarea', required: true },
];

export function ContactFormContent({
  node,
  ctx: _ctx,
}: {
  node: ContactFormNode;
  ctx: RenderContext;
}) {
  const fields = node.fields ?? DEFAULT_FIELDS;
  const submitLabel = node.submitLabel ?? 'Send';

  return (
    <form
      data-node-type="contactForm"
      data-node-id={node.id}
      data-bound-placeholder
      style={intentToStyleVars(node.intent)}
      className="flex flex-col gap-4 w-full max-w-lg"
    >
      {fields.map((field) => {
        const id = `cf-${node.id ?? 'form'}-${field.name}`;
        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium">
              {field.label}
              {field.required === true && (
                <span aria-hidden="true" className="opacity-70">
                  {' '}
                  *
                </span>
              )}
            </label>
            {field.kind === 'textarea' ? (
              <textarea
                id={id}
                name={field.name}
                required={field.required === true}
                placeholder={field.placeholder}
                rows={4}
                className="px-3 py-2 border border-black/20 rounded-md"
              />
            ) : field.kind === 'select' ? (
              <select
                id={id}
                name={field.name}
                required={field.required === true}
                className="px-3 py-2 border border-black/20 rounded-md"
              >
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                name={field.name}
                type={field.kind}
                required={field.required === true}
                placeholder={field.placeholder}
                className="px-3 py-2 border border-black/20 rounded-md"
              />
            )}
          </div>
        );
      })}
      <button
        type="submit"
        style={
          node.intent?.palette
            ? { background: 'var(--node-palette)', color: 'white' }
            : undefined
        }
        className="px-6 py-3 rounded-md font-medium bg-black text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
