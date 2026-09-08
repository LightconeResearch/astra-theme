import { AstraInventoryButton, useAstraPublication } from '@astra-spec/theme-astra';
import { useFrontmatter, useSiteManifest } from '@myst-theme/providers';
import { DownloadsDropdown } from '@myst-theme/frontmatter';

export function DownloadLinksArea() {
  const publication = useAstraPublication();
  const frontmatter = useFrontmatter();
  const site = useSiteManifest();
  const project = site?.projects?.[0];
  const downloads = project?.downloads ?? (project?.exports?.length
    ? project.exports
    : frontmatter?.downloads ?? frontmatter?.exports);
  if (!publication && !downloads?.length) return null;
  return (
    <div className="col-margin mt-3 mx-5 lg:m-0 lg:w-[300px]">
      <div className="astra-page-actions w-fit lg:mx-auto">
        <AstraInventoryButton />
        <DownloadsDropdown exports={downloads} />
      </div>
    </div>
  );
}
