# **Product Requirements Document (PRD)**

> **Note (2026-10-17):** this is the original product intent. What is actually built is tracked in [STATUS.md](STATUS.md). The implementation uses Next.js + Supabase rather than the stack named in §5 (Express/Django, AWS S3, Twilio); see [ARCHITECTURE.md](ARCHITECTURE.md).

## **Project Title:** Lebbu Kale Heywet Church Digital Management Platform (LKH-DMP)

**Prepared by:** [Your Name / Horan Technologies]
**Version:** 1.0
**Date:** [Insert Date]

---

## **1. Purpose and Overview**

The **Lebbu Kale Heywet Digital Management Platform (LKH-DMP)** aims to modernize and digitize the traditional paper-based record and administrative system used by the church. Currently, critical information such as membership records, financial data, meeting minutes, and ministry activities are manually recorded, stored, and retrieved, leading to inefficiencies, data loss risks, and administrative delays.

The digital platform will centralize all church operations — including member registration, financial management, event planning, and ministry coordination — into one secure, user-friendly, and cloud-based system. This will enable church leaders, ministry heads, and members to access accurate data anytime and streamline day-to-day church operations.

---

## **2. Objectives**

1. **Digitization:** Convert all paper-based records into structured digital data.
2. **Centralization:** Provide one unified platform for all ministries and departments.
3. **Transparency:** Ensure financial and operational transparency across all church activities.
4. **Accessibility:** Enable users to access records securely via web or mobile interfaces.
5. **Automation:** Simplify repetitive tasks like attendance tracking, contribution reports, and class scheduling.
6. **Security:** Protect sensitive data using encrypted, cloud-based infrastructure with access control.
7. **Scalability:** Allow future integration with mobile payments, multi-branch management, and reporting tools.

---

## **3. Stakeholders, User Roles, and Responsibilities**

The platform is designed to reflect the real operational hierarchy of Lebbu Kale Heywet Church. Every role has clearly defined responsibilities and system permissions to ensure accountability, clarity, and security.

### **3.1 Church Administrator (System Admin)**

**Who:** Appointed technical or administrative authority trusted by the church leadership.

**Responsibilities:**

* Configure system settings and ministry structure.
* Create, update, and deactivate user accounts.
* Assign roles and permissions.
* Oversee backups, data retention, and system health.
* Manage global announcements and templates.

**System Usage:**

* Full access to all modules and data.
* Audit logs and system activity monitoring.

---

### **3.2 Elders / Senior Leadership**

**Who:** Church elders and senior leaders.

**Responsibilities:**

* Oversight of all ministries.
* Strategic planning and decision making.
* Financial approval and accountability.

**System Usage:**

* View dashboards across all ministries.
* Review attendance, class completion, and spiritual milestones.
* Access consolidated financial reports.
* Approve or reject ministry budgets and expense reports.

---

### **3.3 Ministry Leaders**

**Who:** Leaders of each ministry listed in Section 4.

**Responsibilities:**

* Manage members under their ministry.
* Plan activities, meetings, classes, and programs.
* Track attendance and participation.
* Submit financial expenses and reports.

**System Usage:**

* Ministry specific dashboard.
* Manage schedules, classes, meetings, and documents.
* Upload receipts and submit budget requests.
* Generate ministry level reports.

---

### **3.4 Finance Officers**

**Who:** Treasurer and finance committee members.

**Responsibilities:**

* Record income and expenditures.
* Perform internal audits.
* Prepare financial reports.

**System Usage:**

* Access financial modules only.
* Verify and reconcile receipts.
* Generate monthly, quarterly, and annual reports.

---

### **3.5 Teachers, Trainers, and Facilitators**

**Who:** Teachers, seminar facilitators, and class leaders.

**Responsibilities:**

* Deliver teachings and seminars.
* Track attendance and progress.

**System Usage:**

* Manage assigned classes.
* Record attendance and completion.
* Upload teaching materials.

---

### **3.6 Members / Congregants**

**Who:** Registered church members.

**Responsibilities:**

* Participate in church life and ministries.

**System Usage:**

* View personal profile.
* See ministry involvement and schedules.
* View contribution history.

---

--------|----------------------|------------------|
| **Church Administrator** | System setup, user management, data backup, configuration. | Full Access |
| **Elders/Board Members** | Review reports, oversee ministries, approve budgets. | High Access |
| **Finance Officer** | Manage tithes, offerings, and expenditures. | Restricted Finance Access |
| **Ministry Leaders** | Manage their ministry’s members, attendance, finances, and programs. | Ministry-Level Access |
| **Teachers/Preachers** | Manage classes, attendance, and spiritual growth records. | Limited Access |
| **Members/Congregants** | View personal profiles, contributions, and church announcements. | Personal Access |
| **IT Support** | Technical maintenance, updates, and troubleshooting. | Technical Access |

---

## **4. Core System Modules and Features**

### **A. Ministry Modules and Detailed Functionalities**

Each ministry operates as a dedicated module with workflows designed to fully eliminate paper based processes.

---

#### **1. Spiritual Service Ministry**

**Purpose:** Oversees spiritual care, salvation preparation, baptism readiness, and follow up.

**Functionalities:**

* Register candidates for salvation and baptism preparation.
* Track class participation and completion.
* Record baptism dates and officiating elders.
* Maintain follow up notes and spiritual milestones.
* Generate lists of baptized members by year.

---

#### **2. Teaching and Seminar Ministry**

**Purpose:** Organizes doctrinal teaching, seminars, and structured learning programs.

**Functionalities:**

* Create courses, seminars, and lesson plans.
* Register participants.
* Assign teachers and facilitators.
* Track attendance and completion.
* Store teaching materials and recordings.

---

#### **3. Women’s Ministry**

**Purpose:** Coordinate spiritual growth, fellowship, and service among women.

**Functionalities:**

* Maintain women member registry.
* Plan meetings, retreats, and trainings.
* Record meeting minutes and decisions.
* Track participation and volunteer activities.

---

#### **4. Youth Ministry**

**Purpose:** Engage youth through teaching, mentorship, and programs.

**Functionalities:**

* Youth member registry with age grouping.
* Event planning and attendance tracking.
* Mentorship pairing records.
* Activity reports and engagement tracking.

---

#### **5. Children Ministry**

**Purpose:** Manage children classes, teachers, and yearly lesson plans.

**Functionalities:**

* Class creation by age group.
* Weekly attendance tracking.
* Teacher assignment scheduling.
* Lesson plan repository.
* Parent linkage and communication.

---

#### **6. Mission Ministry**

**Purpose:** Manage outreach, evangelism, and mission activities.

**Functionalities:**

* Plan mission trips and outreach events.
* Track participants and outcomes.
* Record expenses and donations.
* Upload reports and testimonies.

---

#### **7. Marriage and Family Ministry**

**Purpose:** Support marriages and family life.

**Functionalities:**

* Premarital class management.
* Marriage counseling session logs.
* Family seminar scheduling.
* Confidential access control for sensitive records.

---

#### **8. Prayer Groups**

**Purpose:** Coordinate prayer meetings and requests.

**Functionalities:**

* Prayer group registration.
* Meeting schedules.
* Prayer request tracking.
* Attendance logging.

---

#### **9. Administration Ministry**

**Purpose:** Handle organizational operations and documentation.

**Functionalities:**

* Meeting scheduling and minutes.
* Policy and document management.
* Task assignment and follow up.
* Central announcements.

---

#### **10. Deacons**

**Purpose:** Pastoral care, logistics, and member support.

**Functionalities:**

* Care visit tracking.
* Support case documentation.
* Coordination with charity ministry.

---

#### **11. Charity Ministry**

**Purpose:** Provide aid and support to members in need.

**Functionalities:**

* Aid request registration.
* Eligibility review and approval workflow.
* Aid distribution records.
* Audit and reporting.

---

#### **12. Stage and Worship Ministry**

**Purpose:** Manage worship services and stage operations.

**Functionalities:**

* Service schedules.
* Team assignments.
* Equipment and resource tracking.
* Rehearsal planning.

---

#### **13. Neftalem Choir**

**Purpose:** Manage choir operations.

**Functionalities:**

* Choir member registry.
* Rehearsal and performance schedules.
* Song library.
* Attendance and engagement metrics.

---

#### **14. Monthly Workers Aid**

**Purpose:** Manage regular aid to church workers.

**Functionalities:**

* Beneficiary registry.
* Monthly aid calculation.
* Disbursement records.
* Financial reporting.

---

### **C. Financial Management Module**

A secure and transparent financial tracking system that replaces manual bookkeeping.

**Features:**

* Track regular contributions (tithes, offerings, pledges, donations).
* Record expenses by category (ministry spending, maintenance, outreach, etc.).
* Real-time dashboards showing income, expenses, and balance by department.
* Generate reports for audits, board meetings, and government compliance.
* Integration with local payment platforms (Telebirr, CBE Birr, etc.) for digital giving.
* Set financial roles for finance team members with access restrictions.

---

### **D. Event and Calendar Management**

Centralized scheduling and coordination of all church activities.

**Features:**

* Create recurring or one-time events (services, weddings, funerals, Bible studies).
* Track attendance for each event.
* Send notifications and reminders via SMS, email, or push notifications.
* Calendar sync across ministries and members.
* Allow members to register for events online.

---

### **E. Communication and Announcements System**

Facilitates transparent communication across the church community.

**Features:**

* Church-wide bulletin for weekly updates and notices.
* SMS and email notifications to all or selected groups.
* Integration with WhatsApp or Telegram for ministry updates.
* Message templates for recurring announcements.

---

### **F. Document and Archive Management**

Replace physical document cabinets with a digital archive.

**Features:**

* Upload and categorize scanned documents (meeting minutes, certificates, records).
* Search, filter, and tag files for easy retrieval.
* Backup and restore functions.
* Access control to restrict sensitive documents.

---

### **G. Reporting and Analytics**

Comprehensive reporting engine for insights and decision-making.

**Types of Reports:**

* Attendance trends (by ministry, service, or event).
* Financial summaries and trend analytics.
* Ministry performance dashboards.
* Member growth statistics by age, gender, and participation.
* Export reports to PDF, Excel, or CSV.

---

### **H. Access Control and Security**

**Features:**

* Role-based access control (RBAC) ensuring each user only sees relevant modules.
* Secure authentication via password and optional two-factor verification.
* Activity logs for every user action.
* Encrypted data storage and HTTPS-enabled communication.
* Regular automatic backups and version history.

---

## **5. Technical Requirements**

| **Component**           | **Technology/Description**                                       |
| ----------------------- | ---------------------------------------------------------------- |
| **Frontend**            | React.js / Vue.js for responsive web interface                   |
| **Backend**             | Node.js (Express) or Django (Python) for REST APIs               |
| **Database**            | PostgreSQL or Firebase for scalable data handling                |
| **Authentication**      | JWT/OAuth2 for secure login and role management                  |
| **Hosting**             | AWS / Google Cloud with daily automated backups                  |
| **Payment Integration** | APIs for Telebirr, CBE Birr, and Stripe (for diaspora donations) |
| **Notifications**       | Twilio/Infobip for SMS, SendGrid for email notifications         |
| **File Storage**        | AWS S3 or Firebase Storage for documents and images              |

---

## **6. Functional and Non-Functional Requirements**

### **6.1 Functional Requirements**

* The system shall support role based access control.
* The system shall allow each ministry to operate independently while sharing a unified database.
* The system shall provide attendance tracking for classes, meetings, and events.
* The system shall allow uploading and storing documents and receipts.
* The system shall generate financial, attendance, and ministry reports.
* The system shall support multilingual content.
* The system shall provide audit logs for all critical actions.

---

### **6.2 Non-Functional Requirements**

**Security**

* All data shall be encrypted in transit and at rest.
* Sensitive ministries shall have restricted access.
* User actions shall be logged.

**Performance**

* Page load times shall be under 3 seconds on average.
* The system shall handle concurrent users without degradation.

**Usability**

* Designed for non technical users.
* Simple workflows with minimal training required.

**Scalability**

* Support future church branches.
* Modular design for adding new ministries.

**Reliability**

* 99.9 percent uptime target.
* Automated daily backups.

**Accessibility**

* Responsive on desktop and mobile devices.
* Support low bandwidth environments.

---

----------|----------------|
| **Security** | Data encryption, HTTPS, regular penetration testing |
| **Usability** | Designed for non-technical church staff, simple UX/UI |
| **Performance** | Load time under 3 seconds on stable connection |
| **Scalability** | Support multiple branches or churches under one admin panel |
| **Localization** | Multilingual (English, Amharic, Afan Oromo) |
| **Reliability** | 99.9% uptime, daily backups |
| **Accessibility** | Works on desktops, tablets, and smartphones |

---

## **7. Implementation Phases**

### **Phase 1: Core Setup (3 months)**

* Member registration and ministry dashboards.
* Financial and attendance modules.
* Core admin panel and authentication.

### **Phase 2: Ministry Expansion (3–6 months)**

* Full module implementation for all ministries.
* Reports, analytics, and multi-language support.

### **Phase 3: Mobile App & Integrations (6–9 months)**

* Android/iOS apps for leaders and members.
* Payment gateway integration for digital giving.
* Advanced data analytics and cloud sync.

---

## **8. Success Metrics**

* 100% of church records digitized within 6 months.
* 90% reduction in manual paperwork and record retrieval time.
* 80% of church leaders actively using the platform within 3 months.
* Monthly reports automatically generated without manual intervention.
* Positive satisfaction score (>85%) from staff and members.

---

## **9. Future Enhancements**

* Biometric or QR code attendance for members.
* AI-driven predictive reports (attendance, financial forecasting).
* Integration with national databases for secure identity verification.
* Multi-church network version for regional dioceses.
* Advanced pastoral care tracking and counseling modules.

---

## **10. Conclusion**

The **Lebbu Kale Heywet Digital Management Platform** will be a transformational solution that replaces traditional paper-based systems with an integrated, accessible, and scalable digital solution. It ensures transparency, accountability, and improved operational efficiency across every department, empowering leaders to focus more on ministry and less on administrative burdens.
