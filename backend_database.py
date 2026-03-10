import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# In-memory database (replace with PostgreSQL in production)
db = {
    "users": {
        "admin": {
            "id": "user-001",
            "password": hash_password("admin123"),
            "role": "admin",
            "full_name": "IT Administrator",
            "department": "IT"
        },
        "jsmith": {
            "id": "user-002",
            "password": hash_password("pass123"),
            "role": "employee",
            "full_name": "John Smith",
            "department": "Engineering"
        },
        "mjones": {
            "id": "user-003",
            "password": hash_password("pass123"),
            "role": "employee",
            "full_name": "Mary Jones",
            "department": "Finance"
        }
    },
    "devices": {
        "dev-001": {
            "id": "dev-001",
            "device_name": "DELL-ENG-001",
            "device_type": "Laptop",
            "manufacturer": "Dell",
            "cpu": "Intel Core i5-10th Gen",
            "ram_gb": 8,
            "storage_gb": 256,
            "os_name": "Windows 10",
            "os_version": "Windows 10 Pro 21H2",
            "last_updated": "2022-06-15",
            "installed_software": ["Microsoft Office", "Chrome", "Slack", "VS Code"],
            "employee_name": "John Smith",
            "department": "Engineering",
            "submitted_by": "user-002",
            "created_at": "2024-01-10T09:00:00"
        },
        "dev-002": {
            "id": "dev-002",
            "device_name": "HP-FIN-002",
            "device_type": "Desktop",
            "manufacturer": "HP",
            "cpu": "Intel Core i3-8th Gen",
            "ram_gb": 4,
            "storage_gb": 128,
            "os_name": "Windows 10",
            "os_version": "Windows 10 Home 1903",
            "last_updated": "2021-03-10",
            "installed_software": ["Microsoft Office", "QuickBooks", "Chrome"],
            "employee_name": "Mary Jones",
            "department": "Finance",
            "submitted_by": "user-003",
            "created_at": "2024-01-11T10:30:00"
        },
        "dev-003": {
            "id": "dev-003",
            "device_name": "MAC-MKT-003",
            "device_type": "Laptop",
            "manufacturer": "Apple",
            "cpu": "Apple M2",
            "ram_gb": 16,
            "storage_gb": 512,
            "os_name": "macOS",
            "os_version": "macOS Ventura 13.5",
            "last_updated": "2024-01-05",
            "installed_software": ["Microsoft Office", "Figma", "Chrome", "Slack", "CrowdStrike"],
            "employee_name": "Alex Chen",
            "department": "Marketing",
            "submitted_by": "user-001",
            "created_at": "2024-01-12T08:15:00"
        },
        "dev-004": {
            "id": "dev-004",
            "device_name": "LENOVO-IT-004",
            "device_type": "Laptop",
            "manufacturer": "Lenovo",
            "cpu": "Intel Core i7-12th Gen",
            "ram_gb": 32,
            "storage_gb": 1000,
            "os_name": "Windows 11",
            "os_version": "Windows 11 Pro 23H2",
            "last_updated": "2024-02-20",
            "installed_software": ["Microsoft Office", "Chrome", "CrowdStrike", "GlobalProtect", "Acronis"],
            "employee_name": "IT Admin",
            "department": "IT",
            "submitted_by": "user-001",
            "created_at": "2024-01-15T11:00:00"
        },
        "dev-005": {
            "id": "dev-005",
            "device_name": "DELL-HR-005",
            "device_type": "Desktop",
            "manufacturer": "Dell",
            "cpu": "Intel Core i5-6th Gen",
            "ram_gb": 8,
            "storage_gb": 500,
            "os_name": "Windows 7",
            "os_version": "Windows 7 SP1",
            "last_updated": "2020-11-01",
            "installed_software": ["Microsoft Office 2010", "Internet Explorer"],
            "employee_name": "Robert Davis",
            "department": "HR",
            "submitted_by": "user-001",
            "created_at": "2024-01-16T14:00:00"
        }
    }
}
