# install: pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
import os

SCOPES = ['https://www.googleapis.com/auth/drive']

def create_folder(service, name, parent_id=None):
    file_metadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    if parent_id:
        file_metadata['parents'] = [parent_id]
    
    folder = service.files().create(body=file_metadata, fields='id').execute()
    print(f'Created folder: {name} (ID: {folder.get("id")})')
    return folder.get('id')

def main():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    service = build('drive', 'v3', credentials=creds)
    
    folders = {
        "01_Clients": ["Active_Clients", "Prospects", "Completed_Projects", "Templates"],
        "02_Operations": ["Policies_Procedures", "Security_Documentation", "ISO_27001_Framework", "Compliance_Evidence"],
        "03_Finance": ["Invoices", "Contracts", "Financial_Reports", "Budgets"],
        "04_Marketing": ["Content", "Campaigns", "Brand_Assets", "Case_Studies"],
        "05_Internal": ["Team_Resources", "Training_Materials", "Meeting_Notes", "Project_Management"],
        "06_Technical": ["Architecture_Docs", "API_Documentation", "Security_Configs", "Automation_Scripts"]
    }
    
    for parent, children in folders.items():
        parent_id = create_folder(service, parent)
        for child in children:
            create_folder(service, child, parent_id)

if __name__ == '__main__':
    main()
