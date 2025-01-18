package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"
)

const (
	url           = "http://144.76.118.108/proxy.txt"
	outputPath    = "/root/proxy.txt"
	sleepDuration = 5 * time.Minute
)

func downloadFile(url, filepath string) error {
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download file: %s", resp.Status)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	_, err = out.Write(body)
	return err
}

func main() {
	for {
		err := downloadFile(url, outputPath)
		if err != nil {
			fmt.Printf("Error downloading file: %v", err)
		} else {
			fmt.Printf("Successfully downloaded file to %s", outputPath)
		}

		time.Sleep(sleepDuration)
	}
}
