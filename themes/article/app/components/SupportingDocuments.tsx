import { AstraInventoryButton, useAstraPublication } from '@astra-spec/theme-astra';
import { useSiteManifest } from '@myst-theme/providers';
import { SupportingDocuments as MySTSupportingDocuments } from '@myst-theme/site';

export function SupportingDocuments() {
  const publication = useAstraPublication();
  const { projects } = useSiteManifest() ?? {};
  return (
    <>
      <MySTSupportingDocuments />
      {publication && (
        <>
          {!projects?.[0]?.pages?.length && (
            <div className="myst-supporting-documents my-4 text-sm leading-6 uppercase text-slate-900 dark:text-slate-100">
              Supporting Documents
            </div>
          )}
          <ul className="mt-2 flex flex-col gap-2 pl-0 text-sm leading-6 list-none text-slate-700 dark:text-slate-300">
            <li>
              <AstraInventoryButton className="no-underline flex self-center hover:text-blue-700">
                <span aria-hidden="true" className="inline mr-2 w-5 shrink-0 text-center">✨</span>
                <span>ASTRA Inventory</span>
              </AstraInventoryButton>
            </li>
          </ul>
        </>
      )}
    </>
  );
}
