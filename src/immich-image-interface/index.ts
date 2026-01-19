import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
  id: 'immich-image',
  name: 'Immich Image',
  icon: 'photo_library',
  description: 'Select an image from Immich',
  component: InterfaceComponent,
  types: ['json'],
  group: 'relational',
  options: [
    {
      field: 'albumFilter',
      name: 'Album Filter',
      type: 'string',
      meta: {
        interface: 'input',
        note: 'Optional: Limit to specific album ID',
        width: 'full',
      },
    },
    {
      field: 'allowMultiple',
      name: 'Allow Multiple',
      type: 'boolean',
      schema: { default_value: false },
      meta: {
        interface: 'boolean',
        width: 'half',
      },
    },
  ],
});
