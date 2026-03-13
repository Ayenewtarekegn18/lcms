# 📋 Member Registration Form - Complete Structure

## Form Overview
- **Total Steps**: 5
- **Total Fields**: 50+
- **File Uploads**: 2 (Photo, ID Document)
- **Conditional Fields**: 8
- **Required Fields**: 15

---

## 🎯 STEP 1: Personal Profile and Other

### Header
- Title: "Personal profile and other"
- Progress: Step 1 of 5

### Personal Profile Section
**Photo Upload Area**
- Profile picture placeholder (gray box)
- "Upload photo" button
- File input: Images only (*.jpg, *.png, etc.)
- Preview shows selected image

**Name Information** (3-column grid)
- **Title** (Optional)
  - Type: Text Input
  - Placeholder: "Mr., Ms., Dr., etc."
  - Max length: 50 chars

- **First Name*** (Required)
  - Type: Text Input
  - Placeholder: "First name"
  - Max length: 100 chars

- **Father Name*** (Required)
  - Type: Text Input
  - Placeholder: "Father's name"
  - Max length: 100 chars

- **Grandfather Name*** (Required)
  - Type: Text Input
  - Placeholder: "Grandfather's name"
  - Max length: 100 chars

**Gender & Nationality** (2-column)
- **Gender*** (Required)
  - Type: Radio Buttons (2 options)
  - Options: "Male", "Female"
  - Default: "Male"

- **Nationality*** (Required)
  - Type: Dropdown
  - Options: "Ethiopian", "Other"
  - Default: "Ethiopian"

**Mother's Details** (3-column)
- **Mother's First Name** (Optional)
  - Type: Text Input
  - Placeholder: "Mother's first name"

- **Mother's Father Name** (Optional)
  - Type: Text Input
  - Placeholder: "Maternal grandfather name"

- **Mother's Grandmother Name** (Optional)
  - Type: Text Input
  - Placeholder: "Maternal grandmother name"

**Birth Location** (4-column grid)
- **Birth Country** (Optional)
  - Type: Dropdown
  - Options: "Ethiopia", "Other"
  - Default: "Ethiopia"

- **Birth Region** (Optional)
  - Type: Text Input
  - Placeholder: "Region"

- **Birth Zone** (Optional)
  - Type: Text Input
  - Placeholder: "Zone"

- **Birth City** (Optional - 2 columns)
  - Type: Text Input
  - Placeholder: "City"

**Birth Date & ID**
- **Date of Birth*** (Required)
  - Type: Date Picker
  - Format: YYYY-MM-DD
  - Min: 1920, Max: Current date

- **ID Type** (Optional)
  - Type: Dropdown
  - Options: "Select ID Type", "Passport", "National ID", "Driver License"

- **ID Number** (Optional - 2 columns)
  - Type: Text Input
  - Placeholder: "ID number"

**ID Document Upload**
- **Upload your ID** (Optional)
  - Type: File Upload with Preview
  - Dashed border box with preview area
  - "Upload ID" button
  - Accepted: Images (*.jpg, *.png, *.gif)

**Language**
- **Language** (Optional - Full width)
  - Type: Text Input
  - Placeholder: "Language spoken"
  - Example: "Amharic, English"

---

## 🎓 STEP 2: Academic Status

### Header
- Title: "Academic Status"
- Progress: Step 2 of 5

**Academic Information** (Single column)
- **Academic Status*** (Required)
  - Type: Dropdown
  - Options: 
    - "Select Status"
    - "Primary School"
    - "Secondary School"
    - "High School"
    - "Diploma"
    - "Bachelor's Degree"
    - "Master's Degree"
    - "PhD"

- **Field of Study** (Optional)
  - Type: Text Input
  - Placeholder: "Your field of study"
  - Example: "Engineering, Medicine, Business"

**Employment Status** (Single column)
- **Full Time Job Status*** (Required)
  - Type: Dropdown
  - Options:
    - "Select Status"
    - "Student"
    - "Government"
    - "Non Government"
    - "Private Company"
    - "Private Business"
    - "Unemployed"
    - "Housewife"
    - "Retired"

**Employment Details** (3-column grid)
- **Profession** (Optional)
  - Type: Text Input
  - Placeholder: "Your profession"
  - Example: "Engineer, Doctor, Teacher"

- **Company** (Optional)
  - Type: Text Input
  - Placeholder: "Company name"

- **Monthly Income Range** (Optional)
  - Type: Dropdown
  - Options:
    - "Select Range"
    - "0 - 500"
    - "500 - 1000"
    - "1000 - 5000"
    - "5000+"

**Part Time** (Single column)
- **Part Time Job** (Optional)
  - Type: Text Input
  - Placeholder: "Part time job details"
  - Example: "Teaching, Tutoring"

---

## 💑 STEP 3: Marital Status and Children

### Header
- Title: "Marital Status and Children"
- Progress: Step 3 of 5

**Marital Information**
- **Marital Status*** (Required)
  - Type: Radio Buttons (5 options in row)
  - Options: "Single", "Married", "Divorced", "Separated", "Widowed"
  - Default: "Single"

**Conditional: If Married Selected**
- **Spouse Name** (Conditional - Optional)
  - Type: Text Input
  - Placeholder: "Spouse's full name"
  - Shows only if "Married" is selected

**Children Information**
- **Have children or dependencies?*** (Required)
  - Type: Radio Buttons (2 options)
  - Options: "Yes", "No"
  - Default: "No"

**Conditional: If Yes Selected**
- **Children Information** (Conditional - Optional)
  - Type: Textarea
  - Placeholder: "List your children/dependents (names, ages, etc.)"
  - Rows: 4
  - Max length: 1000 chars
  - Shows only if "Yes" is selected

---

## ⛪ STEP 4: Previous Church Information

### Header
- Title: "Previous Church Information"
- Progress: Step 4 of 5

**Transfer Status**
- **Are you transferred from other church?** (Single column)
  - Type: Radio Buttons (2 options)
  - Options: "Yes", "No"
  - Default: "No"

---

### 🔀 BRANCH A: If "Yes" Selected (Transferred)

**Church Details**
- **Former church Name** (Conditional - Optional)
  - Type: Text Input
  - Placeholder: "Name of previous church"

- **Date of resignation** (Conditional - Optional)
  - Type: Date Picker
  - Format: YYYY-MM-DD

**Previous Church Spiritual Reference Information**
Section header: "Previous Church Spiritual Reference Information (Leader, Pastor, Evangelist, etc.)"

- **Title** (Conditional - Optional)
  - Type: Dropdown
  - Options: "Select Title", "Pastor", "Evangelist", "Elder", "Deacon", "Leader"

- **Full Name** (Conditional - Optional)
  - Type: Text Input
  - Placeholder: "Reference person's name"

- **Phone Number** (Conditional - Optional)
  - Type: Text Input
  - Placeholder: "+251 ..."
  - Format: International

**Reason for Resignation*** (Conditional - Required)
- Type: Radio Buttons (7 options)
- Options:
  - "Due to change on residential address"
  - "Due to job location transfer"
  - "Due to personal affairs"
  - "Due to conflict"
  - "Due to marriage"
  - "Due to academic reason"
  - "Other"

**Conditional: If "Other" Selected**
- **Please specify** (Conditional - Optional)
  - Type: Text Input
  - Placeholder: "Specify the reason"
  - Shows only if "Other" is selected

---

### 🔀 BRANCH B: If "No" Selected (Not Transferred)

**Previous Belief**
- **What was your former belief?** (Conditional - Optional)
  - Type: Dropdown
  - Options:
    - "Select belief"
    - "Atheist"
    - "Agnostic"
    - "Traditional Religion"
    - "Muslim"
    - "Other Christian Denomination"
    - "Other"

---

## 🙏 STEP 5: Current Church Engagement

### Header
- Title: "Current Church Engagement"
- Progress: Step 5 of 5

**Spiritual Life Information**
- **How did you accept Jesus christ** (Optional)
  - Type: Textarea
  - Placeholder: "Tell your salvation story"
  - Rows: 4
  - Max length: 2000 chars

- **Salvation date** (Optional)
  - Type: Date Picker
  - Format: YYYY-MM-DD

**Baptism & Membership Status**
- **Are you baptized?*** (Required)
  - Type: Radio Buttons (2 options)
  - Options: "Yes", "No"

- **Membership date*** (Required)
  - Type: Date Picker
  - Format: YYYY-MM-DD

**Church Participation**
- **Do you participate in cell group at church?** (Optional)
  - Type: Radio Buttons (2 options)
  - Options: "Yes", "No"

---

### Ministry Engagement Section
Section header: "Ministry Engagement"

**Ministry Information**
- **Your Current Ministry/Department** (Optional)
  - Type: Dropdown
  - Options:
    - "Select Ministry"
    - "Spiritual Service"
    - "Teaching & Seminar"
    - "Women's Ministry"
    - "Youth Ministry"
    - "Children Ministry"
    - "Mission Ministry"
    - "Stage & Worship"
    - "Choir"

- **Engagement start date** (Optional)
  - Type: Date Picker
  - Format: YYYY-MM-DD

- **Your Role in the ministry** (Optional)
  - Type: Text Input
  - Placeholder: "e.g., Leader, Assistant, Member"

**Gifts & Talents**
- **Gifts and Talents** (Optional)
  - Type: Textarea
  - Placeholder: "List your gifts and talents"
  - Rows: 3
  - Max length: 1000 chars

**Ministry Preferences**
- **Ministry Preferences** (Optional)
  - Type: Checkboxes (6 options - multiple selection allowed)
  - Options:
    - ☐ Spiritual
    - ☐ Technical
    - ☐ Art & Music
    - ☐ Media
    - ☐ Digital
    - ☐ Leadership And Admin

---

## 🎬 Form Navigation

### Bottom Navigation Bar

**Previous Button**
- Disabled on Step 1
- Enabled on Steps 2-5
- Takes user to previous step
- Icon: Left chevron

**Next/Submit Button**
- Steps 1-4: Shows "Next" with right chevron
- Step 5: Shows "Submit Registration"
- Clicking takes to next step or submits form
- Icon: Right chevron (except submit)

---

## 📐 Layout Grid System

### Column Structure
- **Full Width**: 1 column (labels, descriptions, large textareas)
- **2-Column**: Important pairs (first/last, date fields)
- **3-Column**: Groups of related fields
- **4-Column**: Dashboard/grid views
- **Auto**: Responsive at mobile (1 column)

### Spacing
- **Padding**: 24px (content areas)
- **Gap**: 16px (between inputs)
- **Margin**: 32px (between sections)

---

## 🔍 Input Types

| Type | Examples | Props |
|------|----------|-------|
| Text | First Name, Title | maxLength, placeholder |
| Textarea | Gifts, Children Info | rows, maxLength |
| Date Picker | Birth Date, Dates | min, max |
| Dropdown | Gender, Nationality | options array |
| Radio Button | Yes/No, Status | 2-8 options |
| Checkbox | Preferences | multiple, options |
| File Upload | Photo, ID | accept: "image/*" |

---

## ✅ Validation Rules

| Field | Rule | Message |
|-------|------|---------|
| First Name* | Required | "First name is required" |
| Father Name* | Required | "Father name is required" |
| Grandfather Name* | Required | "Grandfather name is required" |
| Gender* | Required | "Please select gender" |
| Nationality* | Required | "Please select nationality" |
| DOB* | Required | "Date of birth required" |
| Academic Status* | Required | "Please select status" |
| Full Time Job* | Required | "Please select job status" |
| Marital Status* | Required | "Please select status" |
| Have Children* | Required | "Please select" |
| Transferred* | Required | "Please select" |
| Reason* | Required (if Yes) | "Please select reason" |
| Baptized* | Required | "Please select" |
| Membership Date* | Required | "Date is required" |

---

## 💾 Data Structure

```javascript
{
  // Step 1
  title: string,
  first_name: string*,
  father_name: string*,
  grandfather_name: string*,
  gender: 'male' | 'female'*,
  nationality: string*,
  mothers_first_name: string,
  mothers_father_name: string,
  mothers_grandmother_name: string,
  birth_country: string,
  birth_region: string,
  birth_zone: string,
  birth_city: string,
  date_of_birth: date*,
  id_type: string,
  id_number: string,
  language: string,
  photo: file,
  id_document: file,
  
  // Step 2
  academic_status: string*,
  field_of_study: string,
  full_time_job: string*,
  profession: string,
  company: string,
  monthly_income: string,
  part_time_job: string,
  
  // Step 3
  marital_status: 'single'|'married'|'divorced'|'separated'|'widowed'*,
  spouse_name: string,
  has_children: 'yes' | 'no'*,
  children_info: string,
  
  // Step 4
  transferred_from_church: 'yes' | 'no'*,
  former_church_name: string,
  date_of_resignation: date,
  reference_title: string,
  reference_name: string,
  reference_phone: string,
  resignation_reason: string*,
  resignation_other: string,
  former_belief: string,
  
  // Step 5
  salvation_story: string,
  salvation_date: date,
  is_baptized: 'yes' | 'no'*,
  membership_date: date*,
  cell_group_participation: 'yes' | 'no',
  ministry_department: string,
  ministry_start_date: date,
  ministry_role: string,
  gifts_talents: string[],
  ministry_preferences: string[]
}
```

---

## 📱 Responsive Breakpoints

- **Desktop (1024px+)**: 3-4 column grids, side-by-side labels
- **Tablet (768px-1023px)**: 2 column grids, full-width on demand
- **Mobile (<768px)**: Single column, stacked inputs

---

## 🎨 Field Styling

- **Background**: Slate-50 (light backgrounds)
- **Border**: Slate-200 (borders)
- **Text**: Slate-900 (labels), Slate-600 (help text)
- **Required**: Red asterisk (*)
- **Error**: Red border + message
- **Focus**: Teal ring (2px)
- **Disabled**: Gray background, reduced opacity

---

Version: 1.0
Last Updated: 2026-01-31
