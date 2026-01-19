import { defineDisplay } from '@directus/extensions-sdk';
import DisplayComponent from './display.vue';

export default defineDisplay({
  id: 'immich-image-display',
  name: 'Immich Image',
  icon: 'image',
  description: 'Display an Immich image thumbnail',
  component: DisplayComponent,
  types: ['json'],
  options: [
    {
      field: 'size',
      name: 'Size',
      type: 'string',
      schema: { default_value: 'thumbnail' },
      meta: {
        interface: 'select-dropdown',
        width: 'half',
        options: {
          choices: [
            { text: 'Thumbnail (250px)', value: 'thumbnail' },
            { text: 'Preview (1440px)', value: 'preview' },
          ],
        },
      },
    },
    {
      field: 'circle',
      name: 'Circle',
      type: 'boolean',
      schema: { default_value: false },
      meta: {
        interface: 'boolean',
        width: 'half',
      },
    },
  ],
});
