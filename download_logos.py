import requests
import re
import os

urls = [
    'https://www.policybazaar.com/',
    'https://www.policybazaar.com/insurance-companies/'
]

logo_urls = set()
# Pattern to match insurer logo URLs
pattern = re.compile(r'https://static\.pbcdn\.in/cdn/images/insurer-logo/[^"\'\s)]+')

for url in urls:
    try:
        print(f'Fetching {url}...')
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        matches = pattern.findall(response.text)
        for m in matches:
            logo_urls.add(m)
    except Exception as e:
        print(f'Error fetching {url}: {e}')

# Also add common payment icons
payment_icons = [
    'https://static.pbcdn.in/cdn/images/career/footer/amex-icon.png',
    'https://static.pbcdn.in/cdn/images/career/footer/visa-icon.png',
    'https://static.pbcdn.in/cdn/images/career/footer/paytm-icon.png',
    'https://static.pbcdn.in/cdn/images/career/footer/rupay-icon.png',
    'https://static.pbcdn.in/cdn/images/career/footer/netbanking-icon.png',
    'https://static.pbcdn.in/cdn/images/career/footer/master-card-icon.png'
]
for icon in payment_icons:
    logo_urls.add(icon)

# Create assets folder
os.makedirs('assets', exist_ok=True)

if not logo_urls:
    print('No logo URLs found.')
else:
    print(f'Found {len(logo_urls)} logos to download.')

for logo_url in logo_urls:
    name = logo_url.split('/')[-1]
    name = name.split('?')[0] # Remove any query params
    path = os.path.join('assets', name)
    try:
        print(f'Downloading {logo_url} to {path}...')
        img_response = requests.get(logo_url)
        if img_response.status_code == 200:
            with open(path, 'wb') as handler:
                handler.write(img_response.content)
        else:
            print(f'Failed to download {logo_url}: Status code {img_response.status_code}')
    except Exception as e:
        print(f'Failed to download {logo_url}: {e}')

print('Done.')
