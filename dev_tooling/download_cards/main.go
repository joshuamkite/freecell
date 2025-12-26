package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"time"
)

// Wikimedia API response structures
type WikimediaResponse struct {
	Query struct {
		Pages map[string]struct {
			ImageInfo []struct {
				URL string `json:"url"`
			} `json:"imageinfo"`
		} `json:"pages"`
	} `json:"query"`
}

// Helper function to get the actual image URL from Wikimedia API
func getImageURL(filename string) (string, error) {
	// Construct API URL
	baseURL := "https://commons.wikimedia.org/w/api.php"
	params := url.Values{}
	params.Add("action", "query")
	params.Add("titles", "File:"+filename)
	params.Add("prop", "imageinfo")
	params.Add("iiprop", "url")
	params.Add("format", "json")

	apiURL := baseURL + "?" + params.Encode()

	// Create HTTP client with proper user-agent
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", err
	}

	// Set user-agent header to comply with Wikimedia policy
	req.Header.Set("User-Agent", "FreeCell Card Downloader/1.0 (https://github.com/joshuamkite/freecell; josh@joshuamkite.com)")

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Parse JSON response
	var result WikimediaResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	// Extract image URL from response
	for _, page := range result.Query.Pages {
		if len(page.ImageInfo) > 0 {
			return page.ImageInfo[0].URL, nil
		}
	}

	return "", fmt.Errorf("no image URL found")
}

// Helper function to download a file
func downloadFile(url, filepath string) error {
	// Create HTTP client with proper user-agent
	client := &http.Client{
		Timeout: 60 * time.Second,
	}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	// Set user-agent header to comply with Wikimedia policy
	req.Header.Set("User-Agent", "FreeCell Card Downloader/1.0 (https://github.com/joshuamkite/freecell; josh@joshuamkite.com)")

	// Get the data
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode != 200 {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Create the file
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	return err
}

func main() {
	// Create directory to save images
	dir := "../../src/assets/cards"
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		fmt.Println("Error creating directory:", err)
		return
	}

	// Download card backs first
	fmt.Println("=== Downloading Card Backs ===")
	cardBacks := map[string]string{
		"card-back-red.svg":  "Reverso_baraja_española_rojo.svg",
		"card-back-blue.svg": "Reverso_baraja_española.svg",
	}

	for localName, wikiName := range cardBacks {
		fmt.Printf("Getting URL for: %s\n", wikiName)
		imgURL, err := getImageURL(wikiName)
		if err != nil {
			fmt.Printf("  Error getting URL: %v\n", err)
			continue
		}

		filepath := path.Join(dir, localName)
		fmt.Printf("  Downloading from: %s\n", imgURL)
		if err := downloadFile(imgURL, filepath); err != nil {
			fmt.Printf("  Error downloading: %v\n", err)
		} else {
			fmt.Printf("  ✓ Downloaded: %s\n", localName)
		}

		// Rate limiting - wait between requests
		time.Sleep(500 * time.Millisecond)
	}

	// Download playing cards
	fmt.Println("\n=== Downloading Playing Cards ===")
	suits := []string{"hearts", "diamonds", "clubs", "spades"}
	ranks := []string{"ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"}

	successCount := 0
	failCount := 0

	for _, suit := range suits {
		for _, rank := range ranks {
			// Byron Knoll uses lowercase for all ranks in the filename
			filename := fmt.Sprintf("English_pattern_%s_of_%s.svg", rank, suit)

			fmt.Printf("Processing: %s\n", filename)

			// Get actual URL from Wikimedia API
			imgURL, err := getImageURL(filename)
			if err != nil {
				fmt.Printf("  Error getting URL: %v\n", err)
				failCount++
				time.Sleep(500 * time.Millisecond)
				continue
			}

			localPath := path.Join(dir, filename)
			fmt.Printf("  Downloading from: %s\n", imgURL)

			if err := downloadFile(imgURL, localPath); err != nil {
				fmt.Printf("  Error downloading: %v\n", err)
				failCount++
			} else {
				fmt.Printf("  ✓ Downloaded successfully\n")
				successCount++
			}

			// Rate limiting - wait between requests to be respectful
			time.Sleep(500 * time.Millisecond)
		}
	}

	fmt.Printf("\n=== Download Summary ===\n")
	fmt.Printf("Successfully downloaded: %d cards\n", successCount)
	fmt.Printf("Failed: %d cards\n", failCount)
	fmt.Printf("Card backs: 2\n")
	fmt.Printf("Cards saved to: %s\n", dir)
}
