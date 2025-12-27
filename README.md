# GearGuard - The Ultimate Maintenance Tracker

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [Business Logic](#business-logic)
6. [Docker Architecture](#docker-architecture)
7. [Backend Engineering](#backend-engineering)
8. [Frontend Engineering](#frontend-engineering)
9. [Design Principles](#design-principles)
10. [Implementation Decisions](#implementation-decisions)
11. [Setup and Development](#setup-and-development)
12. [API Documentation](#api-documentation)

---

## Project Overview

GearGuard is an enterprise-grade maintenance management system designed to track equipment, manage maintenance requests, coordinate technician teams, and provide comprehensive reporting for organizations. The system implements a complete workflow for equipment lifecycle management from acquisition to disposal, with robust role-based access control and audit trails.

### Core Features

- **Equipment Management**: Track equipment across departments with warranty monitoring, location tracking, and assignment management
- **Maintenance Request Workflow**: Complete lifecycle management from request creation through repair or scrapping
- **Team Coordination**: Organize technicians into specialized maintenance teams
- **Time Tracking**: Log technician hours against maintenance requests for accurate billing and resource planning
- **Role-Based Access Control**: Four-tier access system (Admin, Manager, Technician, User)
- **Audit Trails**: Complete history of maintenance request stage changes
- **Reporting**: Analytics for equipment utilization, maintenance costs, and team performance

---

## Architecture

GearGuard follows a modern three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   Client (Next.js 16)                   │
│  - React 19 with Server Components                      │
│  - TanStack Query for data fetching                     │
│  - Zustand for authentication state                     │
│  - Tailwind CSS for styling                             │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/REST API
                  │ JSON over HTTPS
┌─────────────────▼───────────────────────────────────────┐
│              API Layer (FastAPI)                        │
│  - RESTful API with OpenAPI documentation               │
│  - JWT-based authentication                             │
│  - Pydantic validation                                  │
│  - SQLAlchemy ORM                                       │
└─────────────────┬───────────────────────────────────────┘
                  │ SQL Queries
                  │ Connection Pool
┌─────────────────▼───────────────────────────────────────┐
│           Database (PostgreSQL 16)                      │
│  - ACID compliance                                      │
│  - UUID primary keys                                    │
│  - Enum types for data integrity                        │
│  - Referential integrity with foreign keys              │
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Separation of Concerns**: Each layer has a distinct responsibility. The client handles presentation and user interaction, the API layer implements business logic and data validation, and the database ensures data integrity and persistence.

**Scalability**: The stateless API design allows horizontal scaling. Multiple API instances can share the same database with connection pooling. The client-side state management reduces server load.

**Maintainability**: Clear boundaries between layers make the codebase easier to understand and modify. Changes to one layer rarely require changes to others.

**Type Safety**: TypeScript on the frontend and Pydantic on the backend provide end-to-end type safety, catching errors at compile time rather than runtime.

---

## Technology Stack

### Backend

**FastAPI (Python 3.13)**
- Choice Reasoning: FastAPI provides automatic OpenAPI documentation, native async support, and excellent performance through Starlette and Pydantic. Its automatic validation reduces boilerplate code significantly.
- Version: 0.115.0

**PostgreSQL 16**
- Choice Reasoning: PostgreSQL offers robust ACID compliance, advanced data types (UUID, ENUM), excellent JSON support, and mature tooling. Its MVCC architecture provides excellent concurrency handling for maintenance workflows.
- Alpine variant chosen for smaller Docker image size

**SQLAlchemy 2.0**
- Choice Reasoning: Provides a mature ORM with support for complex relationships, lazy loading, and efficient query generation. Version 2.0 brings improved typing and async support.

**Pydantic 2.10**
- Choice Reasoning: Automatic validation, serialization, and documentation generation. Version 2 provides significant performance improvements over v1.

**JWT Authentication (python-jose)**
- Choice Reasoning: Stateless authentication enables horizontal scaling without session storage. JWTs include user identity and roles, reducing database lookups.

**Bcrypt**
- Choice Reasoning: Industry-standard password hashing with configurable work factor. More secure than MD5 or SHA-based approaches.

### Frontend

**Next.js 16 (with Turbopack)**
- Choice Reasoning: Server-side rendering improves initial page load. App Router provides better code organization. Turbopack significantly improves development build times.

**React 19**
- Choice Reasoning: Latest React with improved Suspense, Server Components, and Actions. Provides better performance and developer experience.

**TanStack Query 5**
- Choice Reasoning: Handles server state management, caching, background refetching, and optimistic updates. Reduces boilerplate for data fetching significantly.

**Zustand**
- Choice Reasoning: Lightweight state management for authentication state. Simpler than Redux with less boilerplate while providing sufficient power for global state.

**Tailwind CSS 4**
- Choice Reasoning: Utility-first CSS enables rapid UI development without context switching. Built-in design system ensures consistency. Version 4 provides better performance.

**Axios**
- Choice Reasoning: More features than fetch API, including interceptors for automatic token attachment, request/response transformation, and better error handling.

### Development Tools

**Docker & Docker Compose**
- Consistent development environments across team members
- Production parity in local development
- Easy database management and isolation

---

## Database Design

### Schema Philosophy

The database schema is designed around core principles of normalization, referential integrity, and performance optimization. Every design decision prioritizes data consistency and query efficiency.

### Core Entities

#### 1. Users
The foundation of the authentication and authorization system.

```sql
users (
  id UUID PRIMARY KEY,
  name VARCHAR(150),
  email VARCHAR(255) UNIQUE,
  role user_role DEFAULT 'user',
  password_hash TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Design Decisions**:
- **UUID instead of SERIAL**: UUIDs prevent enumeration attacks, enable distributed ID generation, and simplify data merging across systems
- **Email uniqueness constraint**: Enforced at database level, not just application level, preventing race conditions
- **role ENUM type**: Database-level constraint ensures only valid roles exist, catching bugs before they reach the application
- **Separate password_hash field**: Never store plaintext passwords; bcrypt hashes are one-way
- **is_active flag**: Soft deletion allows maintaining referential integrity while disabling accounts

#### 2. Departments
Organizational structure for equipment assignment.

```sql
departments (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  description TEXT
)
```

**Design Decisions**:
- **Unique name constraint**: Prevents duplicate departments, enforced at database level
- **Simple structure**: Deliberately flat hierarchy; complex org charts can be added later without breaking existing schema

#### 3. Maintenance Teams
Specialized groups for equipment maintenance.

```sql
maintenance_teams (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  specialization VARCHAR(100)
)
```

**Design Decisions**:
- **Specialization field**: Text field for flexibility; could be normalized to enum if specializations become standardized
- **Separate from departments**: Teams may work across departments; separation provides flexibility

#### 4. Technicians
Junction between users and teams with additional metadata.

```sql
technicians (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE → users(id),
  team_id UUID → maintenance_teams(id),
  is_active BOOLEAN DEFAULT TRUE
)
```

**Design Decisions**:
- **Separate technician entity**: Not all users are technicians; this provides role-specific data without polluting the users table
- **user_id UNIQUE constraint**: One user can only be one technician (though they could theoretically be in multiple teams in future iterations)
- **CASCADE on user deletion**: If a user is deleted, their technician record should also be deleted
- **RESTRICT on team deletion**: Cannot delete a team if technicians are assigned to it

#### 5. Equipment
The central entity of the system.

```sql
equipment (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  serial_number VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  purchase_date DATE,
  warranty_expiry DATE,
  location VARCHAR(255),
  department_id UUID → departments(id),
  assigned_employee VARCHAR(255),
  maintenance_team_id UUID → maintenance_teams(id),
  status equipment_status DEFAULT 'active'
)
```

**Design Decisions**:
- **serial_number UNIQUE**: Hardware serial numbers must be unique globally
- **status ENUM**: Only 'active' or 'scrapped'; prevents typos and invalid states
- **warranty_expiry CHECK constraint**: `warranty_expiry >= purchase_date` enforced at database level
- **department_id and maintenance_team_id**: Dual assignment allows organizational tracking while maintaining maintenance responsibility
- **assigned_employee as VARCHAR**: Could be FK to users, but flexibility for external employees chosen
- **RESTRICT on foreign key deletes**: Prevents accidental data loss; equipment must be reassigned before departments/teams can be deleted

#### 6. Maintenance Requests
The workflow engine of the system.

```sql
maintenance_requests (
  id UUID PRIMARY KEY,
  subject VARCHAR(255),
  description TEXT,
  request_type request_type,  -- 'corrective' or 'preventive'
  equipment_id UUID → equipment(id),
  detected_by UUID → users(id),
  assigned_to UUID → technicians(id),
  scheduled_date DATE,
  stage request_stage DEFAULT 'new',  -- 'new', 'in_progress', 'repaired', 'scrap'
  overdue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Design Decisions**:
- **request_type ENUM**: Distinguishes reactive (corrective) from proactive (preventive) maintenance
- **CHECK constraint for preventive maintenance**: `request_type = 'preventive' AND scheduled_date IS NOT NULL` enforces business rule at database level
- **stage ENUM**: Finite state machine ensures requests follow proper workflow
- **CASCADE on equipment deletion**: If equipment is deleted, its requests should also be deleted (equipment likely scrapped)
- **RESTRICT on detected_by deletion**: Cannot delete users who have reported issues; maintains audit trail
- **SET NULL on assigned_to deletion**: If technician is deleted, requests become unassigned rather than failing
- **overdue flag**: Denormalized for query performance; could be computed but pre-calculation is faster
- **Index on stage**: Most queries filter by stage; index dramatically improves performance

#### 7. Time Logs
Tracks technician time for billing and productivity.

```sql
time_logs (
  id UUID PRIMARY KEY,
  request_id UUID → maintenance_requests(id),
  technician_id UUID → technicians(id),
  hours_spent NUMERIC(5,2) CHECK (hours_spent > 0),
  logged_at TIMESTAMP DEFAULT NOW()
)
```

**Design Decisions**:
- **NUMERIC(5,2)**: Stores up to 999.99 hours with precise decimal representation
- **CHECK constraint**: Hours must be positive; prevents data entry errors
- **CASCADE on request deletion**: Time logs are meaningless without their request
- **RESTRICT on technician deletion**: Maintains billing history; technicians with time logs cannot be deleted

#### 8. Request Audit Logs
Complete audit trail of request lifecycle.

```sql
request_audit_logs (
  id UUID PRIMARY KEY,
  request_id UUID → maintenance_requests(id),
  old_stage request_stage,
  new_stage request_stage,
  changed_by UUID → users(id),
  changed_at TIMESTAMP DEFAULT NOW()
)
```

**Design Decisions**:
- **Immutable audit trail**: No UPDATE or DELETE operations on audit logs; append-only
- **old_stage can be NULL**: Initial creation has no previous stage
- **CASCADE on request deletion**: Audit logs are part of request lifecycle
- **RESTRICT on changed_by deletion**: Maintains accountability; cannot delete users who have made changes

### Relationships and Referential Integrity

```
Users (1) ←→ (0..1) Technicians ←→ (*) Maintenance Teams
                                  ↓
Users (*) → Detected Maintenance Requests
Technicians (*) → Assigned Maintenance Requests
                   ↓
Equipment (1) ←→ (*) Maintenance Requests
     ↓
Departments (1) ←→ (*) Equipment
Maintenance Teams (1) ←→ (*) Equipment
```

**Foreign Key Strategies**:
- **CASCADE**: Child data is meaningless without parent (time_logs → requests)
- **RESTRICT**: Prevent accidental deletion of referenced data (departments with equipment)
- **SET NULL**: Soft relationship; parent deletion doesn't invalidate child (assigned technician)

### Indexes Strategy

Strategic indexes improve query performance without excessive storage overhead:

```sql
-- Primary access patterns
CREATE INDEX idx_requests_stage ON maintenance_requests(stage);
CREATE INDEX idx_requests_equipment ON maintenance_requests(equipment_id);
CREATE INDEX idx_requests_assigned_to ON maintenance_requests(assigned_to);
CREATE INDEX idx_equipment_team ON equipment(maintenance_team_id);

-- Authentication and authorization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Performance for joins
CREATE INDEX idx_technicians_user ON technicians(user_id);
CREATE INDEX idx_time_logs_request ON time_logs(request_id);
CREATE INDEX idx_audit_logs_request ON request_audit_logs(request_id);
```

**Index Selection Reasoning**:
- **Frequently filtered columns**: stage, email, role
- **Foreign key columns**: PostgreSQL doesn't auto-index FKs; manual indexes improve JOIN performance
- **Omitted indexes**: Columns rarely used in WHERE clauses are not indexed to save space

### Data Integrity Through Constraints

1. **Domain Constraints**: ENUM types restrict values to valid options
2. **Entity Constraints**: PRIMARY KEY ensures uniqueness
3. **Referential Constraints**: FOREIGN KEY maintains relationships
4. **Semantic Constraints**: CHECK constraints enforce business rules
5. **Key Constraints**: UNIQUE prevents duplicates on natural keys

---

## Business Logic

### Authentication and Authorization

**Authentication Flow**:
1. User submits credentials (email/password)
2. Backend verifies password hash using bcrypt
3. Backend generates JWT token with user ID and expiration
4. Token returned to client and stored in localStorage
5. Subsequent requests include token in Authorization header
6. Backend validates token and extracts user ID
7. User object loaded from database for permission checks

**Design Decision - JWT vs Sessions**:
- **Chosen**: JWT (JSON Web Tokens)
- **Reasoning**: Stateless authentication enables horizontal scaling without session storage. API servers don't need to communicate with each other or share session state. Tokens include user identity, reducing database lookups.
- **Trade-off**: Cannot invalidate tokens before expiration. Mitigated with short expiration times (30 minutes) and refresh token pattern could be added.

**Authorization Model**:
Four hierarchical roles with cumulative permissions:

```python
Role Hierarchy:
├── admin (full access)
├── manager (can manage teams, equipment, requests)
├── technician (can view equipment, work on assigned requests)
└── user (can create requests, view own equipment)
```

**Implementation**:
```python
def require_role(*allowed_roles: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user
    return role_checker
```

**Design Decision - Role-Based vs Attribute-Based**:
- **Chosen**: Role-Based Access Control (RBAC)
- **Reasoning**: System has clear role distinctions. RBAC is simpler to implement and understand than ABAC. Future attribute-based rules can be added within role checks if needed.

### Maintenance Request Workflow

The system implements a finite state machine for request lifecycle:

```
    ┌─────┐
    │ NEW │
    └──┬──┘
       │ assign technician
       ▼
┌──────────────┐
│ IN_PROGRESS  │
└──┬───────┬───┘
   │       │
   │       │ equipment repairable
   ▼       ▼
┌──────┐ ┌──────────┐
│SCRAP │ │ REPAIRED │
└──────┘ └──────────┘
```

**State Transition Rules**:
- **NEW → IN_PROGRESS**: Requires technician assignment
- **IN_PROGRESS → REPAIRED**: Marks successful repair completion
- **IN_PROGRESS → SCRAP**: Equipment beyond economical repair
- **Invalid transitions rejected**: Cannot skip states, cannot reverse states (except admin override)

**Audit Trail**:
Every state change creates an audit log entry:
```python
audit_log = RequestAuditLog(
    request_id=request.id,
    old_stage=current_stage,
    new_stage=new_stage,
    changed_by=current_user.id,
    changed_at=datetime.utcnow()
)
```

**Design Decision - State Machine vs Free-form Status**:
- **Chosen**: Strict state machine
- **Reasoning**: Prevents invalid states, provides clear workflow visibility, enables process metrics. Free-form status would allow inconsistencies and make reporting difficult.

### Time Tracking Logic

Technicians log hours against maintenance requests for billing and productivity analysis.

**Validation Rules**:
1. Hours must be positive (enforced by CHECK constraint)
2. Only assigned technician can log time (enforced by API)
3. Time logs immutable after creation (enforced by API)

**Aggregation**:
```python
def get_request_total_hours(db: Session, request_id: UUID) -> Decimal:
    return db.query(func.sum(TimeLog.hours_spent))\
             .filter(TimeLog.request_id == request_id)\
             .scalar() or Decimal('0.00')
```

**Design Decision - Granular vs Summary Storage**:
- **Chosen**: Granular time entries
- **Reasoning**: Preserves detail for auditing, allows per-technician analysis, enables corrections. Summary approach would lose detail.

### Equipment Lifecycle Management

**Warranty Tracking**:
- `warranty_expiry` field with CHECK constraint `warranty_expiry >= purchase_date`
- API exposes warranty status (active, expired, none)
- Dashboard highlights equipment near warranty expiration

**Status Management**:
- **active**: Equipment in service
- **scrapped**: Equipment disposed or beyond repair
- Scrapped equipment retained in database for historical reporting
- Scrapped equipment cannot receive new maintenance requests

**Design Decision - Hard Delete vs Soft Delete**:
- **Chosen**: Status field (soft delete)
- **Reasoning**: Maintains historical data for reporting and audit. Cost analysis requires complete equipment history. Hard deletion would create referential integrity issues with existing maintenance requests.

---

## Docker Architecture

### Multi-Container Design

The system uses Docker Compose to orchestrate two services: database and API.

```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  api:
    build: .
    depends_on:
      db:
        condition: service_healthy
```

### Design Decisions

**Why Docker?**

1. **Environment Consistency**: Eliminates "works on my machine" problems. Every developer has identical PostgreSQL version, Python version, and dependencies.

2. **Dependency Isolation**: PostgreSQL runs in its own container with no system-level installation required. Python dependencies are containerized, preventing conflicts with system Python.

3. **Easy Setup**: `docker-compose up` starts the entire stack. No manual database installation or configuration.

4. **Production Parity**: Development environment closely matches production Docker deployment.

**Why PostgreSQL in Docker vs Local Installation?**

**Chosen**: Dockerized PostgreSQL

**Advantages**:
- Multiple projects can run different PostgreSQL versions without conflict
- Data directory volume ensures persistence across container restarts
- Easy to reset database by deleting volume
- Consistent PostgreSQL configuration across team
- No sudo/admin rights needed for database installation

**Trade-offs**:
- Slightly more disk space for Docker images
- Additional layer of abstraction for debugging
- Volume performance on Windows/WSL2 can be slower (addressed by using WSL2 filesystem)

### Container Configuration

**Database Container**:
```yaml
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: gearguard
    POSTGRES_PASSWORD: gearguard123
    POSTGRES_DB: gearguard_db
    PGDATA: /var/lib/postgresql/data/pgdata
  ports:
    - "5432:5432"
  volumes:
    - ./postgres_data:/var/lib/postgresql/data
    - ./init.sql:/docker-entrypoint-initdb.d/init.sql
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U gearguard"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Design Decisions**:

- **postgres:16-alpine**: Alpine variant is ~80MB vs ~300MB for full Debian image. PostgreSQL 16 provides latest features and performance improvements.

- **PGDATA customization**: Setting PGDATA ensures data persists in correct volume location even if PostgreSQL internals change.

- **Port mapping**: 5432:5432 allows local tools (pgAdmin, psql) to connect directly to containerized database for debugging.

- **Volume for data**: Named volume `postgres_data` ensures data persists across container rebuilds. Data loss only occurs if volume is explicitly deleted.

- **init.sql mounting**: Automatically initializes schema on first startup. Idempotent schema allows safe container recreation.

- **Health check**: `depends_on` with `condition: service_healthy` ensures API doesn't start until database is ready. Prevents connection errors during startup.

**API Container**:
```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile
  environment:
    DATABASE_URL: postgresql://gearguard:gearguard123@db:5432/gearguard_db
  ports:
    - "8000:8000"
  volumes:
    - ./:/app
  depends_on:
    db:
      condition: service_healthy
```

**Design Decisions**:

- **Build from Dockerfile**: Custom image includes Python 3.11, application code, and dependencies. Rebuilding on code change enables development workflow.

- **Environment variables**: DATABASE_URL uses Docker network DNS (`db` hostname). Compose automatically creates network where containers can reference each other by service name.

- **Port mapping**: 8000:8000 exposes API to host machine, allowing frontend to connect at localhost:8000.

- **Volume mounting**: `./:/app` mounts code directory into container. Combined with uvicorn `--reload`, enables hot reloading during development without container rebuilds.

- **depends_on with health check**: Ensures database is ready before starting API. Without this, API would crash on startup attempting to connect to non-ready database.

### Network Architecture

Docker Compose creates a bridge network automatically:

```
┌────────────────────────────────────┐
│     Docker Bridge Network          │
│                                    │
│  ┌──────────┐    ┌──────────┐      │
│  │ db:5432  │◄───┤ api:8000 │      │
│  └────▲─────┘    └─────▲────┘      │
└───────┼──────────────────┼─────────┘
        │                  │
    localhost:5432    localhost:8000
```

**Design Decision - Bridge Network vs Host Network**:
- **Chosen**: Bridge network (Docker Compose default)
- **Reasoning**: Provides isolation between containers and host. DNS resolution for service names. Better security than host network. Minimal performance overhead for HTTP/SQL traffic.

### Dockerfile Design

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**Layer-by-Layer Analysis**:

1. **Base Image - python:3.11-slim**: 
   - Slim variant (~50MB) vs full Debian (~900MB)
   - Python 3.11 for performance improvements and modern typing features
   - Official Python images maintained by Docker team

2. **WORKDIR /app**: 
   - Sets working directory for subsequent commands
   - Creates directory if it doesn't exist
   - Keeps container filesystem organized

3. **System Dependencies**:
   - `gcc`: Required for compiling psycopg2-binary C extensions
   - `postgresql-client`: Provides psql for debugging
   - `rm -rf /var/lib/apt/lists/*`: Reduces image size by removing apt cache

4. **COPY requirements.txt**:
   - Copied separately before application code
   - Leverages Docker layer caching
   - Only rebuilds dependency layer when requirements.txt changes
   - Dramatically speeds up rebuilds during development

5. **pip install**:
   - `--no-cache-dir`: Reduces image size by not caching downloaded packages
   - Installs FastAPI, SQLAlchemy, and all dependencies

6. **COPY . .**: 
   - Copies application code
   - Separate layer from dependencies enables efficient caching

7. **EXPOSE 8000**: 
   - Documentation that container listens on port 8000
   - Required for automatic port mapping in some orchestrators

8. **CMD**: 
   - Uvicorn ASGI server for running FastAPI
   - `--host 0.0.0.0`: Binds to all interfaces (required for Docker networking)
   - `--reload`: Enables hot reloading during development
   - Production would use multiple workers: `--workers 4`

### Development Workflow

**Starting Development Environment**:
```bash
docker-compose up
```

Process:
1. Compose reads `docker-compose.yml`
2. Builds API image from Dockerfile (if not cached)
3. Pulls postgres:16-alpine image (if not cached)
4. Creates bridge network
5. Starts database container
6. Waits for health check to pass
7. Starts API container
8. Mounts volumes
9. Forwards ports to host

**Making Code Changes**:
1. Edit Python files in host editor
2. Volume mount reflects changes immediately in container
3. Uvicorn detects file change
4. Automatic reload within ~1 second
5. No manual restart required

**Database Management**:
```bash
# Execute commands in database container
docker exec -it gearguard-db psql -U gearguard -d gearguard_db

# View container logs
docker-compose logs db

# Reset database (deletes all data)
docker-compose down
sudo rm -rf postgres_data/pgdata
docker-compose up
```

### Production Considerations

For production deployment, several changes would be made:

1. **Multi-stage Dockerfile**: Separate build and runtime stages to reduce final image size
2. **Non-root user**: Run containers as non-privileged user for security
3. **Secret management**: Use Docker secrets or environment variable injection, not hardcoded credentials
4. **Health checks for API**: Add endpoint and health check configuration
5. **Resource limits**: Set memory and CPU limits to prevent resource exhaustion
6. **Logging configuration**: Output to stdout/stderr for log aggregation
7. **Multiple workers**: `CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--workers", "4"]`
8. **Reverse proxy**: Nginx or Traefik in front of API for SSL/TLS and load balancing

---

## Backend Engineering

### Project Structure

```
server/
├── app/
│   ├── core/
│   │   ├── config.py      # Settings and environment variables
│   │   ├── security.py    # Authentication and authorization
│   │   └── exceptions.py  # Custom exception handling
│   ├── models/            # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic request/response models
│   ├── crud/              # Database operations
│   ├── routers/           # API endpoints
│   └── database.py        # Database connection and session
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── init.sql
```

**Design Decision - Layered Architecture**:

The backend follows a layered architecture pattern:

```
Routers (HTTP) → CRUD (Business Logic) → Models (Data) → Database
```

**Benefits**:
- **Separation of Concerns**: Each layer has one responsibility
- **Testability**: Can test business logic without HTTP layer
- **Reusability**: CRUD operations can be used by multiple routers
- **Maintainability**: Changes to database schema only affect models and CRUD layers

### Models Layer (SQLAlchemy ORM)

Models define database schema and relationships in Python:

```python
class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    serial_number = Column(String, nullable=False, unique=True)
    status = Column(SQLEnum(EquipmentStatus), default=EquipmentStatus.active)
    
    # Relationships
    department = relationship("Department", back_populates="equipment")
    maintenance_requests = relationship(
        "MaintenanceRequest", 
        back_populates="equipment", 
        cascade="all, delete-orphan"
    )
```

**Design Decisions**:

- **Declarative Base**: SQLAlchemy's declarative style keeps Python classes in sync with database schema
- **Type Hints**: `UUID(as_uuid=True)` automatically converts between Python uuid.UUID and database UUID
- **Enums**: `SQLEnum` maps Python enums to PostgreSQL enum types, ensuring type safety
- **Relationships**: `relationship()` enables object navigation without manual joins
- **Cascade Rules**: `cascade="all, delete-orphan"` propagates deletes, matching database foreign key behavior

### Schemas Layer (Pydantic)

Pydantic models define API request and response structures:

```python
class EquipmentBase(BaseModel):
    name: str
    serial_number: str
    category: str | None = None
    status: EquipmentStatus = EquipmentStatus.active

class EquipmentCreate(EquipmentBase):
    department_id: UUID
    maintenance_team_id: UUID

class EquipmentResponse(EquipmentBase):
    id: UUID
    department_id: UUID
    maintenance_team_id: UUID
    
    model_config = ConfigDict(from_attributes=True)
```

**Design Decision - Separate Schemas for Create/Update/Response**:

**Why not reuse models?**

1. **Security**: Response models exclude sensitive fields (password_hash). Request models enforce required fields.
2. **Validation**: Create requires all fields. Update allows partial updates. Response includes generated fields (id, created_at).
3. **Documentation**: OpenAPI spec shows exact request/response structure for each endpoint.
4. **Evolution**: Can change API contracts without changing database schema.

### CRUD Layer

CRUD modules encapsulate database operations:

```python
def get_equipment_list(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    department_id: UUID | None = None,
    search: str | None = None
) -> list[Equipment]:
    query = db.query(Equipment).options(
        joinedload(Equipment.department),
        joinedload(Equipment.maintenance_team)
    )
    
    if department_id:
        query = query.filter(Equipment.department_id == department_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Equipment.name.ilike(search_pattern),
                Equipment.serial_number.ilike(search_pattern)
            )
        )
    
    return query.offset(skip).limit(limit).all()
```

**Design Decisions**:

- **joinedload()**: Eagerly loads relationships in single query, preventing N+1 query problem
- **Optional filters**: Flexible querying without combinatorial explosion of function parameters
- **Pagination**: `skip` and `limit` parameters prevent memory exhaustion on large datasets
- **Case-insensitive search**: `ilike()` provides better user experience than exact matching

### Router Layer (FastAPI)

Routers define HTTP endpoints:

```python
@router.get("/", response_model=list[EquipmentResponse])
async def list_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    department_id: UUID | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    equipment = crud.get_equipment_list(
        db, skip=skip, limit=limit,
        department_id=department_id, search=search
    )
    return equipment
```

**Design Decisions**:

- **Dependency Injection**: `Depends()` provides database session and current user
- **Automatic Validation**: `Query()` with constraints validates and documents parameters
- **Automatic Serialization**: Pydantic `response_model` converts SQLAlchemy models to JSON
- **Type Safety**: Type hints enable IDE autocomplete and catch errors at development time

### Authentication Implementation

**Password Hashing**:
```python
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )
```

**Design Decision - Bcrypt Parameters**:
- Default work factor: 12 rounds
- ~250ms hash time on modern CPU
- Balances security (resistant to brute force) with user experience (fast enough for login)

**JWT Token Generation**:
```python
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
```

**Token Payload**:
```json
{
  "sub": "user-uuid-here",
  "exp": 1735354800
}
```

**Design Decision - Minimal Payload**:
- Only user ID in token, not full user object
- Reduces token size
- User details fetched from database on each request (enables immediate effect of role changes)
- Trade-off: Extra database query per request, but ensures fresh authorization data

### Error Handling

Custom exception handlers provide consistent error responses:

```python
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "A database error occurred",
            "type": "DatabaseError"
        }
    )
```

**Design Decision - Abstracting Database Errors**:
- Never expose raw SQL errors to client (security risk)
- Provides user-friendly messages
- Logs full exception server-side for debugging
- Distinguishes between client errors (4xx) and server errors (5xx)

---

## Frontend Engineering

### Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   │   ├── equipment/
│   │   │   ├── requests/
│   │   │   ├── teams/
│   │   │   └── technicians/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── common/      # Reusable UI components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   ├── equipment/   # Equipment feature components
│   │   └── layout/      # Layout components (Navbar, etc.)
│   ├── lib/
│   │   ├── api.ts       # API client
│   │   ├── auth.ts      # Auth utilities
│   │   └── permissions.ts
│   ├── hooks/
│   │   └── useApi.ts    # React Query hooks
│   ├── store/
│   │   └── authStore.ts # Zustand store
│   └── types/           # TypeScript types
├── next.config.ts
└── tsconfig.json
```

### Design Decision - App Router over Pages Router

**Chosen**: Next.js App Router

**Reasoning**:
- Server Components reduce client bundle size
- Nested layouts reduce code duplication
- Improved data fetching with async/await in components
- Better TypeScript support
- File-based routing with `(groups)` for logical organization

### State Management Strategy

**Three-Tier State Architecture**:

1. **Server State (TanStack Query)**:
   - Equipment, requests, technicians, etc.
   - Cached with automatic background refetching
   - Optimistic updates for mutations

2. **Authentication State (Zustand)**:
   - Current user and token
   - Persisted to localStorage
   - Global access without prop drilling

3. **UI State (React State)**:
   - Form inputs
   - Modal open/closed
   - Temporary UI feedback

**Design Decision - Why Not Redux?**

**Chosen**: TanStack Query + Zustand

**Reasoning**:
- TanStack Query handles server state better than Redux (caching, refetching, synchronization)
- Zustand is simpler than Redux for authentication state (no reducers, actions, middleware boilerplate)
- Combined solution is more performant and requires less code

### API Client Design

```typescript
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' }
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(config => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getEquipment(params) {
    const response = await this.client.get('/api/equipment', { params });
    return response.data;
  }
}
```

**Design Decisions**:

- **Singleton instance**: One axios instance with configured interceptors
- **Automatic token attachment**: No need to manually add Authorization header to every request
- **Automatic 401 handling**: Expired tokens immediately redirect to login
- **Typed methods**: Each API method has specific TypeScript types for params and returns

### React Query Integration

```typescript
export function useEquipment(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: ['equipment', filters],
    queryFn: () => apiClient.getEquipment(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: EquipmentCreate) => apiClient.createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}
```

**Design Decisions**:

- **Query key with filters**: Automatically creates separate cache entries for different filter combinations
- **staleTime**: Data considered fresh for 5 minutes, reduces unnecessary refetching
- **Cache invalidation**: Successful mutations invalidate related queries, triggering automatic refetch
- **Custom hooks**: Encapsulates React Query configuration, provides consistent API across components

### Component Architecture

**Composition over Inheritance**:

```typescript
// Composable components
<LoadingScreen>
  <EquipmentList />
</LoadingScreen>

// vs inheritance
class EquipmentList extends LoadingComponent { }
```

**Design Decision - Composition**:
- More flexible (combine multiple behaviors)
- Better TypeScript support
- Easier testing (mock composed components)
- React community standard

**Presentational vs Container Pattern**:

```typescript
// Container - handles logic
function EquipmentPage() {
  const { data, isLoading } = useEquipment();
  
  if (isLoading) return <LoadingScreen />;
  return <EquipmentList equipment={data} />;
}

// Presentational - renders UI
function EquipmentList({ equipment }: { equipment: Equipment[] }) {
  return (
    <div>
      {equipment.map(item => <EquipmentCard key={item.id} {...item} />)}
    </div>
  );
}
```

**Benefits**:
- Presentational components are reusable and testable
- Logic centralized in container components
- Clear separation of concerns

### Error Boundary Implementation

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Design Decision - Error Boundaries at Layout Level**:
- Wraps entire application to catch all React errors
- Prevents white screen of death
- Displays user-friendly error message with reload option
- Errors are logged but don't crash the app

---

## Design Principles

### 1. Fail Fast

**Database Level**: CHECK constraints, foreign keys, and NOT NULL constraints catch invalid data immediately rather than allowing corrupt data to propagate.

**API Level**: Pydantic validation fails requests with invalid data before hitting business logic.

**Frontend Level**: TypeScript catches type errors at compile time.

**Benefit**: Bugs are caught early where they're cheapest to fix.

### 2. Don't Repeat Yourself (DRY)

**CRUD Layer**: Database operations encapsulated in reusable functions rather than duplicated across routers.

**API Client**: Single axios instance with interceptors rather than repeating auth logic in every request.

**Types**: Shared TypeScript types prevent duplication between components.

### 3. Single Responsibility Principle

**Routers**: Handle HTTP concerns (parsing requests, formatting responses)

**CRUD**: Handle database operations and business logic

**Models**: Define data structure and relationships

**Schemas**: Define validation and serialization

**Benefit**: Changes to one concern don't cascade to others. Easy to understand and test each layer.

### 4. Principle of Least Privilege

**Role-Based Access**: Users only see and can modify what their role permits.

**Database User**: Application connects with limited database user, not superuser.

**JWT Tokens**: Contain minimal information (user ID only, not sensitive data).

### 5. Separation of Concerns

**Frontend/Backend Split**: Client doesn't contain business logic. Backend doesn't contain presentation logic.

**Docker Containers**: Database and API are separate, can be scaled independently.

**Environment Configuration**: Secrets in environment variables, not hardcoded.

### 6. Convention over Configuration

**Next.js File Routing**: File structure defines routes automatically.

**SQLAlchemy Conventions**: Standard naming for foreign keys and indexes.

**FastAPI Automatic Docs**: OpenAPI generated from code, not manually maintained.

**Benefit**: Less boilerplate, more consistency, easier onboarding.

### 7. Database as Source of Truth

**Constraints at Database Level**: Business rules enforced in schema, not just application code.

**Reasoning**: Multiple applications might access database. Constraints ensure consistency regardless of access method.

### 8. Optimistic UI Updates

**TanStack Query**: Shows expected result immediately, rolls back if mutation fails.

**Benefit**: Feels faster to users, reduces perceived latency.

---

## Implementation Decisions

### Why PostgreSQL over MySQL/MongoDB?

**Chosen**: PostgreSQL

**Reasoning**:
- **ACID Compliance**: Critical for financial data (time tracking, billing)
- **Advanced Types**: UUID, ENUM, JSON provide better modeling
- **Constraints**: CHECK constraints enforce business rules at database level
- **Performance**: Excellent query planner for complex joins
- **Open Source**: No licensing concerns, active community

**Trade-offs**:
- More complex than SQLite
- Steeper learning curve than MySQL
- Requires more resources than lightweight databases

### Why FastAPI over Django/Flask?

**Chosen**: FastAPI

**Reasoning**:
- **Performance**: ASGI-based, significantly faster than Django/Flask
- **Automatic Documentation**: OpenAPI/Swagger generated automatically
- **Type Safety**: Native Pydantic integration catches errors at development time
- **Modern Python**: Async/await support, Python 3.10+ features
- **Developer Experience**: Excellent error messages, autocomplete support

**Trade-offs**:
- Less mature than Django (fewer third-party packages)
- Smaller community than Flask
- Requires understanding of async programming

### Why Next.js over Create React App?

**Chosen**: Next.js

**Reasoning**:
- **Server-Side Rendering**: Improves initial page load time
- **File-Based Routing**: Reduces boilerplate compared to react-router
- **API Routes**: Can host simple API endpoints in same codebase if needed
- **Production Ready**: Built-in optimization, caching, and performance features
- **Active Development**: Regular updates, strong community support

**Trade-offs**:
- More opinionated than CRA
- Larger learning curve
- Vercel-specific features may create vendor lock-in

### Why JWT over Session Cookies?

**Chosen**: JWT

**Reasoning**:
- **Stateless**: No session storage required, easier horizontal scaling
- **Cross-Domain**: Can authenticate across multiple domains/services
- **Mobile-Friendly**: Works with mobile apps without cookie issues
- **Payload Data**: Can include user role, reducing database queries

**Trade-offs**:
- Cannot revoke tokens before expiration (mitigated with short expiration)
- Larger than session IDs (mitigated with minimal payload)
- XSS risk if stored in localStorage (mitigated with Content Security Policy)

### Why UUID over Auto-Increment IDs?

**Chosen**: UUID

**Reasoning**:
- **Security**: Prevents enumeration attacks (can't guess next ID)
- **Distributed Systems**: Can generate IDs without coordinating with database
- **Data Migration**: No ID conflicts when merging data from multiple sources
- **API URLs**: Obscures record counts from competitors

**Trade-offs**:
- Larger storage (16 bytes vs 4 bytes)
- Slower indexing than sequential integers
- Less human-readable in logs/debugging

### Why TanStack Query over Redux?

**Chosen**: TanStack Query (React Query)

**Reasoning**:
- **Purpose-Built**: Designed specifically for server state management
- **Automatic Caching**: No need to manually implement cache logic
- **Background Refetching**: Keeps data fresh automatically
- **Less Boilerplate**: No reducers, actions, or middleware required
- **Better Developer Experience**: Hooks-based API is simpler than Redux

**Trade-offs**:
- Less suitable for complex client-side state machines
- Different mental model than Redux
- Smaller ecosystem of developer tools

---

## Setup and Development

### Prerequisites

- **Docker Desktop**: Version 20.10+ with Docker Compose v2
- **Node.js**: Version 18+ (for frontend development)
- **WSL2** (Windows users): For optimal performance

### Quick Start

1. **Clone repository**:
```bash
git clone <repository-url>
cd TheCodebreakers-GearGuard-Odoo
```

2. **Start backend**:
```bash
cd server
./setup.sh  # Automated setup script
```

This script:
- Checks Docker installation
- Creates `.env` file with default configuration
- Sets up PostgreSQL data directory
- Builds and starts containers
- Applies database schema
- Seeds test data
- Verifies API is running

3. **Start frontend**:
```bash
cd client
npm install
npm run dev
```

4. **Access application**:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### Development Workflow

**Backend Development**:
```bash
# View logs
docker-compose logs -f api

# Execute commands in API container
docker-compose exec api bash

# Restart API
docker-compose restart api

# View database
docker exec -it gearguard-db psql -U gearguard -d gearguard_db
```

**Frontend Development**:
```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

**Database Operations**:
```bash
# Apply schema
./apply-schema.sh

# Seed data
./seed.sh

# Reset database (WARNING: deletes all data)
docker-compose down
sudo rm -rf postgres_data/pgdata
docker-compose up -d
```

### Environment Variables

**Backend (.env)**:
```bash
POSTGRES_USER=gearguard
POSTGRES_PASSWORD=gearguard123
POSTGRES_DB=gearguard_db
DATABASE_URL=postgresql://gearguard:gearguard123@localhost:5432/gearguard_db

SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK_DATA=false
```

---

## API Documentation

### Authentication Endpoints

**POST /api/auth/login**
Authenticate user and return access token.

Request:
```json
{
  "username": "admin@gearguard.com",
  "password": "password"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@gearguard.com",
    "role": "admin"
  }
}
```

### Equipment Endpoints

**GET /api/equipment**
List equipment with optional filters.

Query Parameters:
- `skip`: Pagination offset (default: 0)
- `limit`: Items per page (default: 100, max: 100)
- `department_id`: Filter by department UUID
- `team_id`: Filter by maintenance team UUID
- `category`: Filter by equipment category
- `search`: Search in name, serial number, location

**GET /api/equipment/{id}**
Get specific equipment with details.

**POST /api/equipment**
Create new equipment.

Request:
```json
{
  "name": "Industrial Compressor",
  "serial_number": "IC-2024-001",
  "category": "HVAC",
  "department_id": "uuid",
  "maintenance_team_id": "uuid",
  "purchase_date": "2024-01-15",
  "warranty_expiry": "2026-01-15",
  "location": "Building A - Floor 2",
  "assigned_employee": "John Doe"
}
```

**PATCH /api/equipment/{id}**
Update equipment (partial update supported).

**DELETE /api/equipment/{id}**
Delete equipment and all related maintenance requests.

### Maintenance Request Endpoints

**GET /api/maintenance-requests**
List requests with filters.

Query Parameters:
- `stage`: Filter by stage (new, in_progress, repaired, scrap)
- `type`: Filter by type (corrective, preventive)
- `equipment_id`: Filter by equipment UUID
- `assigned_to`: Filter by technician UUID

**POST /api/maintenance-requests**
Create new maintenance request.

**PATCH /api/maintenance-requests/{id}**
Update request (including stage transitions).

---

## Conclusion

GearGuard demonstrates modern software engineering practices across the full stack. The architecture prioritizes data integrity, security, and developer experience while maintaining flexibility for future enhancements.

Key engineering highlights:

- **Database-first design** with constraints ensuring data consistency
- **Type safety** from PostgreSQL enums through SQLAlchemy models to TypeScript interfaces
- **Layered architecture** providing clear separation of concerns
- **Docker-based development** ensuring environment consistency
- **Comprehensive error handling** at every layer
- **Performance optimization** through indexing, eager loading, and caching
- **Security by design** with RBAC, JWT authentication, and principle of least privilege

The codebase is production-ready with proper error handling, logging, and monitoring hooks. Future enhancements can be added incrementally without major refactoring due to the solid architectural foundation.
