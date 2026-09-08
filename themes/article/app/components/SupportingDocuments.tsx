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
          <AstraInventoryButton className="astra-inventory-document mt-2 flex items-center gap-2 text-sm leading-6 no-underline">
            <span aria-hidden="true" className="w-5 shrink-0 text-center">✨</span>
            <span>ASTRA Inventory</span>
          </AstraInventoryButton>
        </>
      )}
    </>
  );
}
