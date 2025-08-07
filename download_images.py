#!/usr/bin/env python3
"""
Simple script to download all images for the Memory Game
Run this script to download all external images to the images/ folder
"""

import os
import requests
import urllib.parse

# Create images directory if it doesn't exist
os.makedirs('images', exist_ok=True)

# URLs and their corresponding filenames
images_to_download = [
    ("https://www.extra-leker.no/media/catalog/product/cache/92542945a20c5be4864d45dd54ceb81b/n/t/nti-883132_1__276261__h62090134.jpg", "images/A_AKEBRETT.jpg"),
    ("https://lade.tropehagen.no/wp-content/uploads/sites/34/pim-product/Tetra-startersett-akvarium-11251.jpg", "images/A_AKVARIUM.jpg"),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/R%C3%B6e_g%C3%A5rd_caf%C3%A9_2.jpg/1200px-R%C3%B6e_g%C3%A5rd_caf%C3%A9_2.jpg", "images/C_CAFE.jpg"),
    ("https://www.novaparks.com/sites/default/files/styles/scale_1440/public/2025-03/PohickBayPark20240831-NP-03%20-%20web.jpg", "images/C_CAMPING.jpg"),
    ("https://www.temashop.no/media/catalog/product/cache/cat_resized/1200/0/c/o/cowboyvast_kostymer_studentskiva_1_repbg.jpg", "images/C_COWBOY.jpg"),
    ("https://bilder.ngdata.no/7090000248093/kmh/large.jpg", "images/C_COLA.jpg"),
    ("https://www.barnesanger.no/leker/stiv-heks/stiv-heks.jpg", "images/H_HEKS.jpg"),
    ("https://verdensbakeriet.no/assets/uploads/appelsin-juice-46a004b6-1ccb-11ed-8f75-ce7bda36116d_verdens_bakerier8444.jpg", "images/J_JUICE.jpg"),
    ("https://media.snl.no/media/6733/standard_laks.jpg", "images/L_LAKS.jpg"),
    ("https://webshop.blob.core.windows.net/cache/c/3/a/9/9/5/c3a99580da89a85bfbf7f0d3ad4c306c280afed4.jpg", "images/O_OVN.jpg"),
    ("https://arktiskfilharmoni.no/wp-content/uploads/2019/10/SYmf.orkester_Marthe-M%C3%B8lstre-NY-e1571308844879.jpg", "images/O_ORKESTER.jpg"),
    ("https://hampshireflag.co.uk/wp-content/uploads/2023/03/HFC20Qatar20Flag.png", "images/Q_QATAR.png"),
    ("https://www.temashop.no/media/catalog/product/cache/cat_resized/1200/0/p/o/politilys_og_sirene_tilbeh_r_byggeklosser_bursdag.jpg", "images/S_SIRENE.jpg"),
    ("https://media.snl.no/media/238022/article_topimage_aal.jpg", "images/Å_ÅL.jpg"),
]

def download_image(url, filename):
    """Download an image from URL and save it to filename"""
    try:
        print(f"Downloading {filename}...")
        
        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        
        print(f"✓ Successfully downloaded {filename}")
        
    except Exception as e:
        print(f"✗ Failed to download {filename}: {e}")
        return False
    
    return True

def main():
    print("🎮 Memory Game Image Downloader")
    print("=" * 40)
    
    successful = 0
    failed = 0
    
    for url, filename in images_to_download:
        if download_image(url, filename):
            successful += 1
        else:
            failed += 1
    
    print("\n" + "=" * 40)
    print(f"✓ Successfully downloaded: {successful}")
    print(f"✗ Failed downloads: {failed}")
    print(f"📁 Images saved to: {os.path.abspath('images')}")
    
    if failed == 0:
        print("🎉 All images downloaded successfully!")
        print("💡 Your memory game can now run offline!")
    else:
        print(f"⚠️  {failed} images failed to download. Check the URLs and try again.")

if __name__ == "__main__":
    main()