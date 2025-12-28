# Card Image Downloader

This tool downloads playing card SVG images from Wikimedia Commons (Byron Knoll set) for use in the FreeCell game.

## Usage

```bash
cd dev_tooling/download_cards
go mod download
go run main.go
```

This will download all 52 playing card SVG files from the Byron Knoll set (Public Domain).

Images are saved to: `../../src/assets/cards/`