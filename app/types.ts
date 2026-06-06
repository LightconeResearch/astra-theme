import type { CommonTemplateOptions } from '@myst-theme/common';
import type { SiteManifest } from 'myst-config';

export type TemplateOptions = CommonTemplateOptions & {
  hide_search?: boolean;
  hide_title_block?: boolean;
};

export type ManifestProject = Required<SiteManifest>['projects'][0];
