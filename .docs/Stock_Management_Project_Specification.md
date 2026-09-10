# Project Specification (Cahier des Charges)
## Capstone Project - Shop Stock Management System
### Spring Boot (REST API) + Angular (SPA Front-End)

---

## 1. Context and Purpose

This capstone project concludes a training program covering the fundamentals of **Java / Spring Boot** on the back-end and **Angular** on the front-end. It is designed to let the trainees apply, in a single coherent application, everything covered during the training:

- Spring Boot: Entities, Tables, Repositories, Services, Controllers (Spring Security is **excluded** from the scope - authentication below is implemented manually, without the Spring Security framework).
- Angular: Components & Child Components, Templates, Styles, Services, HTTP Requests.

The application to build is a **Stock Management System for a shop**, allowing the shop owner and staff to log in, register products, sell them, track stock levels, search for products, view statistics on a dashboard, keep a full history of operations (with the identity of whoever performed each one), and generate (database-level) electronic invoices.

---

## 2. Objectives

By the end of the project, the trainees must be able to deliver a working full-stack application that:

1. Persists data in a relational database via JPA entities.
2. Exposes a REST API following standard architecture (Controller -> Service -> Repository).
3. Consumes that API from an Angular front-end built with reusable components.
4. Demonstrates parent/child component communication and a clean separation of templates, styles, and logic.
5. Identifies the current user and attaches that identity to every operation performed.
6. Provides basic analytics (a dashboard) computed from the stored data.

---

## 3. Functional Requirements

| # | Feature | Description |
|---|----------|-------------|
| F1 | **Authentication** | A user must log in (username/password) before accessing the application. The identity of the logged-in user is known throughout the session and attached to every operation they perform. |
| F2 | **Register a product** | Create, update, view and delete products (name, reference/SKU, category, purchase price, selling price, quantity in stock, alert threshold). |
| F3 | **Sell a product** | Create a sale: select one or several products with quantities, automatically decrease stock, compute the total, and generate the related invoice. |
| F4 | **Inventory** | Display the full list of products with their current stock, and allow a manual stock adjustment (physical count correction). |
| F5 | **Check product availability** | Search products by name/reference/category and see whether they are in stock (quantity > 0) or below the alert threshold. |
| F6 | **Calculations / Dashboard** | Show key indicators: total stock value, number of sales, revenue (day/week/month), top-selling products, low-stock alerts. |
| F7 | **Operations history (audit trail)** | Every stock-impacting action (registration, sale, adjustment) must be logged with date, type, product, quantity, **the user who performed it**, and, if relevant, the related sale. |
| F8 | **Electronic invoices (DB only)** | Each sale generates an invoice record persisted in the database (no PDF generation required at this stage). |

---

## 4. Proposed Data Model

This model is a **suggestion**; trainees may adapt field names, but the relationships and the reasoning behind them should be preserved and justified.

### 4.1 Entities

**User**
- id, username, password, fullName, createdAt
- Note: since Spring Security is excluded, password comparison can be done with a simple, lightweight hashing utility (e.g. `BCrypt` used standalone, without pulling in the full Spring Security starter). Storing plain-text passwords should still be avoided if possible, but is tolerated for the sake of this exercise if hashing was never covered in training.

**Category**
- id, name, description

**Product**
- id, name, reference, category (ManyToOne -> Category), purchasePrice, sellingPrice, quantityInStock, alertThreshold, createdAt

**Sale**
- id, saleDate, totalAmount, customerName (optional, free text - no customer management module required), performedBy (ManyToOne -> User)
- OneToMany -> SaleItem

**SaleItem**
- id, sale (ManyToOne -> Sale), product (ManyToOne -> Product), quantity, unitPrice, subtotal

**Invoice**
- id, invoiceNumber, invoiceDate, sale (OneToOne -> Sale), totalAmount

**StockOperation** (audit trail)
- id, operationType (enum: `REGISTRATION`, `SALE`, `ADJUSTMENT`), product (ManyToOne -> Product), quantityChange (positive or negative), operationDate, comment, performedBy (ManyToOne -> User)

### 4.2 Relationship Summary

```
User     (1) ────< (N) Sale
User     (1) ────< (N) StockOperation
Category (1) ────< (N) Product
Sale     (1) ────< (N) SaleItem  >──── (N) Product
Sale     (1) ──── (1) Invoice
Product  (1) ────< (N) StockOperation
```

---

## 5. Technical Requirements - Back-End (Spring Boot)

For **each** entity above, trainees must implement the full layered architecture:

1. **Entity** - JPA-annotated class mapped to its table, with correct relationship annotations (`@OneToMany`, `@ManyToOne`, `@OneToOne`) and validation annotations where relevant (`@NotNull`, `@Min`, etc.).
2. **Repository** - `JpaRepository` interface, plus at least one derived query method per repository where meaningful (e.g. `findByCategory`, `findByNameContainingIgnoreCase`, `findByQuantityInStockLessThan`, `findByUsername`).
3. **Service** - All business logic lives here, not in the controller. Required business rules:
   - A user must exist and provide matching credentials to log in; the service returns the authenticated user's identity (id, username, fullName) - no token/session framework required, a simple returned object is enough at this stage.
   - Every sale, product registration, and stock adjustment must record **which user performed it** (`performedBy`).
   - A sale cannot be created if the requested quantity exceeds the available stock.
   - Selling a product must decrease `quantityInStock` and create a `StockOperation` of type `SALE`.
   - Registering/updating a product's stock creates a `StockOperation` of type `REGISTRATION`.
   - A manual inventory adjustment creates a `StockOperation` of type `ADJUSTMENT`.
   - A successful sale automatically creates the corresponding `Invoice`.
4. **Controller (REST)** - Expose clean REST endpoints (see suggested API below), using proper HTTP verbs and status codes, and DTOs to avoid exposing entities directly if the trainees have seen this pattern (optional but encouraged). Since Spring Security is excluded, the identity of the acting user is passed explicitly by the front-end (e.g. a `userId` field included in the request body of any operation-creating endpoint), rather than being resolved from a security context.

### 5.1 Suggested REST Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Authenticate a user (username + password), return user identity |
| POST | `/api/products` | Register a new product (includes `userId` of the person registering it) |
| PUT | `/api/products/{id}` | Update a product |
| GET | `/api/products` | List all products |
| GET | `/api/products/{id}` | Get one product |
| GET | `/api/products/search?query=...` | Search products by name/reference |
| DELETE | `/api/products/{id}` | Delete a product |
| POST | `/api/sales` | Create a sale (list of product/quantity pairs + `userId`) |
| GET | `/api/sales` | List all sales |
| GET | `/api/sales/{id}` | Sale detail |
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/{id}` | Invoice detail |
| POST | `/api/inventory/adjust` | Manually adjust a product's stock (includes `userId`) |
| GET | `/api/stock-operations` | List all operations (audit trail), filterable by product/type/date/user |
| GET | `/api/dashboard/summary` | Aggregated KPIs for the dashboard |

---

## 6. Technical Requirements - Front-End (Angular)

The Angular application must be organized around clear, reusable components, matching what was taught:

### 6.1 Suggested Component Tree

```
AppComponent
 ├── LoginComponent (entry point when no user is logged in)
 ├── NavbarComponent (shows the logged-in user's name and a logout action)
 ├── ProductListComponent (parent)
 │     └── ProductFormComponent (child - used for create/edit, as a modal or inline)
 │     └── ProductCardComponent (child - one row/card per product)
 ├── SaleComponent (parent)
 │     └── ProductSelectorComponent (child - pick products & quantities)
 │     └── CartSummaryComponent (child - shows the running total before validating the sale)
 ├── InventoryComponent
 ├── StockOperationHistoryComponent (displays the user responsible for each entry)
 ├── InvoiceListComponent
 │     └── InvoiceDetailComponent (child)
 └── DashboardComponent
       └── KpiCardComponent (child - reusable small stat card, used multiple times)
```

This structure specifically forces trainees to practice:
- **Parent -> Child** communication via `@Input()` (e.g., passing a product to `ProductCardComponent`).
- **Child -> Parent** communication via `@Output()` + `EventEmitter` (e.g., `ProductFormComponent` emitting a "product saved" event, or `ProductSelectorComponent` emitting the selected item to add to the cart).
- Reusable presentational components (`KpiCardComponent`, `ProductCardComponent`).

### 6.2 Services

- `AuthService` - handles login, keeps track of the current logged-in user for the duration of the session (e.g. in a simple in-memory/`BehaviorSubject` store, optionally persisted to `localStorage` so a page refresh does not lose the session), and exposes it to any component/service that needs to attach `userId` to a request.
- `ProductService` - all HTTP calls related to products (`HttpClient`, GET/POST/PUT/DELETE).
- `SaleService` - creating sales, fetching sale history.
- `InvoiceService` - fetching invoices.
- `StockOperationService` - fetching the operations history.
- `DashboardService` - fetching aggregated KPIs.

Each service should return **Observables**, and components should subscribe to them (or use the `async` pipe if it was covered). Every service call that creates a sale, registers a product, or adjusts stock must read the current user from `AuthService` and include it in the request payload.

### 6.3 Templates & Styles

- Use Angular templates (`*ngFor`, `*ngIf`, event binding, property binding, `[(ngModel)]` for forms) to render lists, forms and conditional UI (e.g., highlighting low-stock products in red, showing/hiding the app shell based on login state).
- Each component should have its own scoped stylesheet (component-level CSS/SCSS) rather than one global stylesheet, to reinforce Angular's style encapsulation.
- The dashboard should visually present at least: total stock value, total revenue, and a low-stock alert list. A charting library is optional - a well-styled set of KPI cards is sufficient if charts were not covered.

---

## 7. Non-Functional / Constraints

- No Spring Security framework - authentication is implemented manually (a login endpoint plus a user identity carried by the front-end), not with tokens, sessions, or filters.
- No PDF generation - invoices are database records only.
- No fine-grained authorization/roles required - any logged-in user can perform any operation; the point is traceability, not access control.
- Database: any relational database used during training (e.g., MySQL/PostgreSQL/H2).
- Code should follow the same package/folder conventions used throughout the training (e.g., `entity`, `repository`, `service`, `controller` packages; `core`, `shared`, `features` structure or similar on the Angular side).

---

## 8. Step-by-Step Realization Plan

### Phase 1 - Analysis & Design (0.5 day)
1. Validate the data model (entities, fields, relationships) with the trainer.
2. Draw the final entity-relationship diagram.
3. List the final REST endpoints and the Angular component tree.

### Phase 2 - Back-End Foundations (1-1.5 days)
4. Set up the Spring Boot project (dependencies: Web, JPA, database driver, Validation).
5. Configure the database connection (`application.properties`).
6. Create all entities, including `User`, and verify the schema is correctly generated.
7. Create all repositories, with the required derived query methods.

### Phase 3 - Back-End Business Logic (2-2.5 days)
8. Implement `AuthService` (login: verify credentials, return user identity).
9. Implement `ProductService` (CRUD + search), recording the acting user on registration.
10. Implement `SaleService` (stock check, stock decrement, invoice creation, stock operation logging with the acting user).
11. Implement `InventoryService`/adjustment logic (stock operation logging with the acting user).
12. Implement `DashboardService` (aggregation queries/logic for KPIs).
13. Implement all Controllers and test every endpoint with Postman/Insomnia before touching the front-end.

### Phase 4 - Front-End Foundations (1-1.5 days)
14. Set up the Angular project, routing, and the overall layout (Navbar + router-outlet).
15. Build `LoginComponent` and `AuthService`; wire the app so the rest of the UI is only reachable once logged in.
16. Create all remaining services and connect them to the back-end endpoints.
17. Verify data retrieval end-to-end (e.g., display the raw product list) before building the polished UI.

### Phase 5 - Front-End Features (2-3 days)
18. Build `ProductListComponent` + `ProductCardComponent` + `ProductFormComponent` (register/edit product).
19. Build `SaleComponent` + `ProductSelectorComponent` + `CartSummaryComponent` (sell a product).
20. Build `InventoryComponent` (view stock, trigger manual adjustments).
21. Build `StockOperationHistoryComponent` (audit trail, filterable table, showing the responsible user).
22. Build `InvoiceListComponent` + `InvoiceDetailComponent`.
23. Build `DashboardComponent` + `KpiCardComponent`.

### Phase 6 - Styling & Polish (0.5-1 day)
24. Apply consistent styling across components (scoped styles).
25. Add basic UX feedback (loading states, confirmation messages, low-stock highlighting, login errors).

### Phase 7 - Testing & Delivery (0.5 day)
26. Manual end-to-end test of every functional requirement (F1-F8).
27. Fix bugs, clean up code, remove console logs/dead code.
28. Prepare a short demo (5-10 minutes) walking through each feature, including login and traceability of operations.

**Estimated total duration: 8-10 working days**, adjustable to the trainees' pace.

---

## 9. Evaluation Criteria

| Criterion | Weight |
|-----------|--------|
| Correct entity/table design and relationships (including User) | 10% |
| Clean layered back-end architecture (Controller/Service/Repository) | 15% |
| Authentication flow and correct traceability of the acting user | 15% |
| Correct business logic (stock rules, invoice generation, audit trail) | 20% |
| Angular component structure (parent/child, reusability) | 15% |
| Correct use of services & HTTP requests (Observables) | 15% |
| UI clarity, styling, and overall usability | 5% |
| Code quality & organization | 5% |

---

## 10. Possible Extensions (Optional, if time remains)

- Add a `Supplier` entity for restocking.
- Add pagination/sorting to product and history lists.
- Add a route guard (`CanActivate`) to protect Angular routes based on login state.
- Add simple roles (e.g. `ADMIN`/`STAFF`) to restrict certain actions, without introducing Spring Security.
- Export the dashboard data or invoice list to CSV.
- Add simple charts (e.g., Chart.js) to the dashboard.

These extensions are **not required** for validation of the capstone project - they are bonus opportunities for trainees who finish early.
