# Directus Immich Extension

A Directus extension that integrates [Immich](https://immich.app/) with Directus, allowing you to browse and select images from your Immich library directly within Directus.

## Features

- **Image Picker Interface** - Browse and select images from Immich within Directus fields
- **Album Browsing** - Switch between image grid and album view
- **Search & Filter** - Search by filename, filter by album, camera make/model
- **Stack Support** - View and select from stacked images
- **Multi-Select** - Select multiple images or entire albums
- **Album Sync** - Link selections to albums with ability to sync when album contents change
- **Image Display** - Display component for showing selected Immich images

## Screenshots

### Select Button
![Select from Immich button](https://raw.githubusercontent.com/be-ez/directus-extension-immich/main/docs/images/button.png)

### Search & Filters
![Search and filter interface](https://raw.githubusercontent.com/be-ez/directus-extension-immich/main/docs/images/search_and_filter.png)

### Field Interface
![Immich Image field interface](https://raw.githubusercontent.com/be-ez/directus-extension-immich/main/docs/images/model.png)

## Requirements

- Directus 10.x or later
- Immich instance with API access
- Immich API key

## Installation

1. Copy the extension to your Directus extensions folder:
   ```
   extensions/directus-extension-immich/
   ```

2. Add environment variables to your Directus configuration:
   ```env
   IMMICH_URL=http://your-immich-server:2283
   IMMICH_API_KEY=your-api-key-here
   ```

3. Restart Directus

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `IMMICH_URL` | URL to your Immich server | `http://10.0.0.3:2283` |
| `IMMICH_API_KEY` | Immich API key for authentication | `abc123...` |

### Getting an Immich API Key

1. Open Immich and go to **Account Settings** (click your user icon in the top right)
2. Navigate to **API Keys**
3. Click **New API Key** and give it a name (e.g., "Directus Extension")
4. **Important**: Select the required scopes:
   - `asset:read` - Required to browse and view images
   - `album:read` - Required to browse albums
5. Click **Create** and copy the generated key

**Note**: The extension only requires read access. It does not modify, upload, or delete any assets in your Immich library.

## Usage

### Interface (Image Picker)

Add a JSON field to your collection and select **Immich Image** as the interface.

**Options:**
- `allowMultiple` - Enable multi-select mode
- `albumFilter` - Pre-filter to a specific album ID

### Display

Select **Immich Image Display** to show thumbnails of selected images in the collection view.

## Data Structure

### Single Image
```json
{
  "id": "asset-uuid",
  "originalFileName": "photo.jpg",
  "type": "IMAGE",
  "thumbhash": "..."
}
```

### Multiple Images (Album-Linked)
```json
{
  "albumId": "album-uuid",
  "albumName": "My Album",
  "images": [
    { "id": "...", "originalFileName": "...", "type": "IMAGE" }
  ]
}
```

## Building from Source

```bash
npm install
npm run build
```

## License

MIT
