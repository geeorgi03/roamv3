# Password Reset Feature Documentation

## ✅ What's Implemented

Your Roam app now has a complete forgot password / password reset flow using Supabase Auth.

---

## 🎯 User Flow

### 1. Forgot Password (Auth Screen)
**Location**: `/src/app/screens/AuthScreen.tsx`

**Steps**:
1. User on sign-in screen
2. Clicks "Forgot password?" link
3. Form switches to password reset mode
4. User enters email
5. Clicks "Send Reset Link"
6. Success message appears: "Password reset instructions sent to your email!"
7. User receives email with reset link

### 2. Reset Password (Reset Screen)
**Location**: `/src/app/screens/ResetPasswordScreen.tsx`
**Route**: `/reset-password`

**Steps**:
1. User clicks link in email
2. Redirected to `/reset-password`
3. Enters new password
4. Confirms new password
5. Clicks "Update Password"
6. Success screen shows ✓
7. Auto-redirects to home (authenticated)

---

## 📁 Files Modified/Created

### Modified Files

1. **`/src/app/contexts/AuthContext.tsx`**
   - Added `resetPassword(email)` function
   - Added `updatePassword(newPassword)` function
   - Updated TypeScript interface

2. **`/src/app/screens/AuthScreen.tsx`**
   - Added forgot password state
   - Added "Forgot password?" link
   - Form adapts based on mode (sign in / sign up / forgot password)
   - Success/error messaging

3. **`/src/app/routes.tsx`**
   - Added `/reset-password` route

### New Files

1. **`/src/app/screens/ResetPasswordScreen.tsx`**
   - Dedicated password reset screen
   - Password confirmation validation
   - Success state with auto-redirect

---

## 🔧 Technical Implementation

### AuthContext Functions

```typescript
// Send password reset email
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

// Update user's password (when they have reset token)
const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};
```

### AuthScreen States

```typescript
const [isSignUp, setIsSignUp] = useState(false);           // Sign up mode
const [isForgotPassword, setIsForgotPassword] = useState(false); // Reset mode
```

**Form behavior**:
- `isForgotPassword = true` → Shows only email field + "Send Reset Link" button
- `isForgotPassword = false && isSignUp = false` → Normal sign in
- `isForgotPassword = false && isSignUp = true` → Sign up mode

---

## 🎨 UI States

### Auth Screen - Forgot Password Mode

**Visible Elements**:
- ✅ Email input field
- ✅ "Send Reset Link" button
- ✅ "Back to Sign In" link

**Hidden Elements**:
- ❌ Password field
- ❌ Name field
- ❌ "Sign In" / "Sign Up" toggle

### Reset Password Screen

**Form**:
- New password input (minimum 6 characters)
- Confirm password input
- "Update Password" button
- "Cancel" link

**Success State**:
- Large green checkmark ✓
- "Password Updated!" heading
- "Redirecting you to the app..." message
- Auto-redirect after 2 seconds

**Error States**:
- "Passwords do not match"
- "Password must be at least 6 characters"
- Network/API errors

---

## 📧 Email Configuration

### Important Note

**For Prototyping (Current Setup)**:
- Supabase sends password reset emails automatically
- No additional configuration needed
- Reset links point to your app's domain

**For Production**:
You need to configure:

1. **Email Templates** in Supabase Dashboard
   - Go to Authentication → Email Templates
   - Customize "Reset Password" template
   - Set redirect URL to your production domain

2. **Email Provider** (optional but recommended)
   - By default, Supabase uses their email service
   - For production, integrate SendGrid, AWS SES, etc.
   - Configure in Supabase → Settings → Auth

3. **Redirect URL**
   - Set in Supabase Dashboard → Auth → URL Configuration
   - Should point to your app's `/reset-password` route
   - Example: `https://your-app.com/reset-password`

---

## 🧪 Testing

### Test the Complete Flow

1. **Trigger Reset**
   ```
   1. Go to sign in screen
   2. Click "Forgot password?"
   3. Enter: test@example.com
   4. Click "Send Reset Link"
   5. Should see success message
   ```

2. **Check Email**
   ```
   1. Open email inbox for test@example.com
   2. Find "Reset Password" email from Supabase
   3. Email contains reset link
   ```

3. **Reset Password**
   ```
   1. Click link in email
   2. Should redirect to /reset-password
   3. Enter new password (min 6 chars)
   4. Confirm password
   5. Click "Update Password"
   6. See success checkmark
   7. Auto-redirect to home (authenticated)
   ```

4. **Verify New Password**
   ```
   1. Sign out
   2. Sign in with new password
   3. Should work!
   ```

---

## 🔒 Security Features

### Built-in Protections

1. **Token Expiry**
   - Reset tokens expire after 1 hour (Supabase default)
   - Can be configured in Supabase Dashboard

2. **Single Use**
   - Reset tokens can only be used once
   - After password update, token is invalidated

3. **Email Verification**
   - Reset link only sent to registered email
   - No information leakage if email doesn't exist

4. **Password Requirements**
   - Minimum 6 characters (can be increased)
   - Validation on both frontend and backend

---

## 🎯 User Experience

### Design Principles

1. **Clear Feedback**
   - Success messages are green with confirmation
   - Error messages are red with explanation
   - Loading states during async operations

2. **Easy Navigation**
   - "Back to Sign In" link always visible
   - "Cancel" option on reset screen
   - Auto-redirect after success

3. **Validation**
   - Password confirmation required
   - Immediate feedback on mismatch
   - Clear requirements stated

---

## 🐛 Error Handling

### Common Errors

**"User not found"**
- Email not registered in system
- Solution: User needs to sign up first

**"Invalid or expired token"**
- Reset link is too old (>1 hour)
- Reset link already used
- Solution: Request new reset link

**"Passwords do not match"**
- Confirmation field doesn't match
- Solution: Re-enter matching passwords

**"Password must be at least 6 characters"**
- New password too short
- Solution: Use longer password

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Password Strength Indicator**
   - Visual meter showing password strength
   - Real-time feedback as user types

2. **Rate Limiting**
   - Prevent spam of reset requests
   - Block after X failed attempts

3. **Custom Email Templates**
   - Branded emails matching Roam design
   - Personalized messaging

4. **Password Requirements**
   - Require uppercase, lowercase, numbers
   - Require special characters
   - Minimum 8+ characters

5. **Multi-Factor Authentication**
   - SMS or authenticator app codes
   - Added security layer

6. **Password History**
   - Prevent reusing recent passwords
   - Force password rotation

---

## 📊 Flow Diagram

```
┌─────────────────┐
│  Sign In Screen │
└────────┬────────┘
         │
         │ Click "Forgot password?"
         │
         ▼
┌─────────────────────┐
│ Email Input         │
│ [Send Reset Link]   │
│ [Back to Sign In]   │
└────────┬────────────┘
         │
         │ Submit
         │
         ▼
┌─────────────────────┐
│ Success Message     │
│ "Check your email"  │
└─────────────────────┘
         │
         │ User receives email
         │
         ▼
┌─────────────────────┐
│ Email with Link     │
│ [Reset Password]    │
└────────┬────────────┘
         │
         │ Click link
         │
         ▼
┌─────────────────────┐
│ Reset Password Page │
│ New Password        │
│ Confirm Password    │
│ [Update Password]   │
└────────┬────────────┘
         │
         │ Submit
         │
         ▼
┌─────────────────────┐
│ Success Screen ✓    │
│ Auto-redirect (2s)  │
└────────┬────────────┘
         │
         ▼
┌─────────────────┐
│  Home (Auth'd)  │
└─────────────────┘
```

---

## 📝 Code Examples

### Using resetPassword in a component

```tsx
import { useAuth } from '../contexts/AuthContext';

const { resetPassword } = useAuth();

const handleForgotPassword = async (email: string) => {
  try {
    await resetPassword(email);
    alert('Check your email for reset instructions!');
  } catch (error) {
    alert(error.message);
  }
};
```

### Using updatePassword in a component

```tsx
import { useAuth } from '../contexts/AuthContext';

const { updatePassword } = useAuth();

const handleUpdatePassword = async (newPassword: string) => {
  try {
    await updatePassword(newPassword);
    alert('Password updated successfully!');
  } catch (error) {
    alert(error.message);
  }
};
```

---

## ✅ Checklist

Before deploying to production:

- [ ] Configure custom email templates in Supabase
- [ ] Set proper redirect URLs for your domain
- [ ] Test email delivery to real addresses
- [ ] Implement rate limiting on reset requests
- [ ] Add password strength requirements
- [ ] Test on mobile devices
- [ ] Add analytics tracking for reset flow
- [ ] Document password policy for users
- [ ] Test error scenarios thoroughly
- [ ] Configure production email provider

---

## 🎉 Summary

Your Roam app now has a complete, secure password reset flow:

✅ "Forgot password?" link on auth screen  
✅ Email-based password reset  
✅ Dedicated reset screen with validation  
✅ Success states and error handling  
✅ Auto-redirect after success  
✅ Supabase Auth integration  

Users can now recover their accounts if they forget their passwords!
