# 🎯 Quick Reference - All Buttons & Navigation

## 📍 Button Locations

### 🏠 Dashboard (`/dashboard`)
| Button | Action | Location |
|--------|--------|----------|
| + Add Member | Navigate to registration form | Quick Actions row |
| + View Ministries | Go to ministries page | Quick Actions row |
| + Financial Report | Go to financial page | Quick Actions row |
| + View Calendar | Go to events page | Quick Actions row |
| Total Members | Navigate to members list | Stats card (clickable) |
| Ministries | Navigate to ministries | Stats card (clickable) |
| Upcoming Events | Navigate to events | Stats card (clickable) |

### 👥 Members Page (`/dashboard/members`)
| Button | Action | Location |
|--------|--------|----------|
| + Add Member | Go to registration form | Top right |
| 👁️ | View full member details | Actions column |
| ✏️ | Edit member in modal | Actions column |
| 🗑️ | Delete member | Actions column |

### 📝 Member Registration (`/dashboard/members/register`)
| Button | Action | Location |
|--------|--------|----------|
| Previous | Go to previous step | Bottom left |
| Next | Go to next step | Bottom right (Steps 1-4) |
| Submit Registration | Save member | Bottom right (Step 5) |
| Browse (Photo) | Upload profile photo | Step 1 |
| Browse (ID) | Upload ID document | Step 1 |

### 💰 Financial (`/dashboard/financial`)
| Button | Action | Location |
|--------|--------|----------|
| + Record Transaction | Open transaction form | Card header |
| + New Budget | Create budget entry | Card header |
| Delete | Remove transaction | Transaction row |
| Export Report | Download financial data | Card actions |

### 📅 Calendar (`/dashboard/calendar`)
| Button | Action | Location |
|--------|--------|----------|
| + Schedule Event | Open event form | Header |
| Edit | Modify event | Event row |
| Delete | Remove event | Event row |

### 📢 Communications (`/dashboard/communications`)
**Announcements Tab:**
| Button | Action | Location |
|--------|--------|----------|
| + New Announcement | Go to Compose tab | Card header |
| Edit | Edit announcement | Announcement row |
| Delete | Remove announcement | Announcement row |

**Compose Tab:**
| Button | Action | Location |
|--------|--------|----------|
| Save as Draft | Save draft announcement | Form footer |
| Publish Announcement | Send to recipients | Form footer |

**Templates Tab:**
| Button | Action | Location |
|--------|--------|----------|
| Use Template | Load template | Template card |

### 📄 Documents (`/dashboard/documents`)
| Button | Action | Location |
|--------|--------|----------|
| + Upload Document | Open upload form | Card header |
| Download | Download file | Document row |
| Share | Open share options | Document row |
| Delete | Remove document | Document row |

### 🏛️ Ministry (`/dashboard/ministry`)
| Button | Action | Location |
|--------|--------|----------|
| Ministry Card | Go to ministry details | Grid cards |
| Back | Return to grid | Ministry detail page |

### 📊 Reports (`/dashboard/reports`)
| Button | Action | Location |
|--------|--------|----------|
| Export | Download report | Tab content |
| Filter | Change date range | Report controls |
| Print | Print report | Report header |

---

## 🔄 Form Navigation

### Member Registration Flow
```
START
  ↓
STEP 1: Personal Profile
  ↓ (Next)
STEP 2: Academic Status
  ↓ (Next)
STEP 3: Marital Status
  ↓ (Next)
STEP 4: Previous Church
  ↓ (Next)
STEP 5: Church Engagement
  ↓ (Submit)
SUCCESS
```

### Form Back Navigation
- Can go back from any step
- Previous button disabled on Step 1
- Data preserved when navigating back
- Can edit and re-submit

---

## 📋 Field Shortcuts

### Step 1 Key Fields
- Photo Upload → Browse button
- ID Document → Browse button
- Date of Birth → Date picker
- Nationality → Dropdown (Ethiopian/Other)

### Step 2 Key Dropdowns
- Academic Status (7 options)
- Full Time Job (8 options)
- Monthly Income (4 ranges)

### Step 3 Conditionals
- Shows Spouse field if Married selected
- Shows Children Details if Yes selected

### Step 4 Branching
- "Yes" → Shows church fields
- "No" → Shows belief dropdown

### Step 5 Checkboxes
- 6 ministry preferences
- Multiple selections allowed

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move to next field |
| Shift+Tab | Move to previous field |
| Enter | Submit form (if button focused) |
| Escape | Close modal dialogs |

---

## 📱 Responsive Behavior

### Desktop (1024px+)
- Full side navigation
- Multi-column layouts
- All buttons visible
- Modals centered

### Tablet (768px-1023px)
- Sidebar collapses
- 2-column grids
- Touch-friendly buttons
- Modals full-width with margins

### Mobile (< 768px)
- Full-width layouts
- Single column
- Larger touch targets
- Modals full-screen
- Stacked buttons

---

## 🎨 Button States

### Enabled
- Full color
- Cursor changes to pointer
- Hover effect active

### Disabled (e.g., Step 1 Previous)
- Reduced opacity
- Cursor is not-allowed
- No hover effect

### Hover
- Background darkens
- Subtle shadow appears
- Smooth transition

### Active/Clicked
- Color changes
- Loading indicator (if applicable)
- Feedback message

---

## 🔗 Direct URLs

### Main Sections
- Dashboard: `/dashboard`
- Members: `/dashboard/members`
- Member Registration: `/dashboard/members/register`
- Financial: `/dashboard/financial`
- Calendar: `/dashboard/calendar`
- Communications: `/dashboard/communications`
- Documents: `/dashboard/documents`
- Ministry: `/dashboard/ministry`
- Reports: `/dashboard/reports`

### Form Redirect
- Add Member: `/dashboard/members/register`
- Edit Member: `/dashboard/members` (modal)
- View Details: `/dashboard/members` (modal)

---

## 💡 Pro Tips

1. **Form Data** - Data auto-saves in browser state (won't persist page reload unless connected to backend)
2. **Multi-Step** - You can jump between steps (future feature)
3. **Mobile** - All forms are optimized for mobile entry
4. **Accessibility** - All form fields are properly labeled
5. **Validation** - Required fields marked with * (asterisk)

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not responding | Check page load, may need refresh |
| Form data lost | Connect backend database |
| Modal not opening | Ensure JavaScript enabled |
| Navigation not working | Check URL routing in Next.js |
| Upload not working | Configure file storage service |

---

## 📞 Important Numbers

**Required Fields in Registration:**
- Step 1: First Name, Gender, Nationality, DOB, ID Type/Number
- Step 2: Academic Status, Full Time Job
- Step 3: Marital Status, Have Children
- Step 4: Transferred Status, Resignation Reason (if applicable)
- Step 5: Baptism Status, Membership Date

**Total Steps: 5**
**Total Fields: 50+**
**Total Screens: 10+** (dashboard + 9 main pages + registration form)

---

Last Updated: 2026-01-31
Version: 1.0
