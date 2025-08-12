# 🚀 **Supabase Setup Guide for Love Story Website**

## **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `love-story` (or any name you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for project to be created (2-3 minutes)

## **Step 2: Get Your Credentials**

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://abcdefghijklmnop.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## **Step 3: Set Up Environment Variables**

1. Create a `.env` file in your project root:
   ```bash
   VITE_SUPABASE_URL=https://your-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Important**: Never commit `.env` to git! Add it to `.gitignore`

## **Step 4: Create Database Schema**

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `supabase-schema.sql`
3. Paste it in the SQL editor
4. Click "Run" to execute the schema

## **Step 5: Configure Storage**

1. Go to **Storage** in your Supabase dashboard
2. The storage bucket `love-story-images` will be created automatically
3. If not, create it manually:
   - **Name**: `love-story-images`
   - **Public bucket**: ✅ Checked
   - **File size limit**: 50MB
   - **Allowed MIME types**: `image/*, video/*`

## **Step 6: Test the Setup**

1. Start your development server: `npm run dev`
2. Open the website
3. Try uploading an image
4. Check the browser console for any errors
5. Check Supabase dashboard to see if files appear

## **Step 7: Deploy to Netlify**

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. In Netlify, add environment variables:
   - Go to **Site settings** → **Environment variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Deploy your site

## **🔧 Troubleshooting**

### **Common Issues:**

1. **"Invalid API key" error**
   - Check your environment variables
   - Make sure you're using the `anon` key, not the `service_role` key

2. **"Bucket not found" error**
   - Run the SQL schema first
   - Check if storage bucket was created

3. **"CORS error"**
   - This shouldn't happen with Supabase, but check your bucket settings

4. **Images not loading**
   - Check if files were uploaded to storage
   - Verify bucket is public
   - Check browser console for errors

### **Debug Steps:**

1. Open browser console (F12)
2. Look for errors in the Network tab
3. Check Supabase dashboard for failed requests
4. Verify environment variables are loaded

## **📱 Testing Cross-Device**

1. **Upload from Mobile**: Visit your website on mobile and upload an image
2. **View from PC**: Open the same website on your PC
3. **Check**: The image should now be visible on both devices!

## **🔒 Security Notes**

- The `anon` key is safe to use in frontend code
- Row Level Security (RLS) is enabled but allows public access
- For production, consider adding user authentication
- File uploads are limited to 50MB per file

## **💰 Cost Information**

- **Free Tier**: 500MB database, 1GB file storage, 2GB bandwidth
- **Pro Plan**: $25/month for more storage and features
- **Pay-as-you-go**: Additional storage costs extra

## **🎯 Next Steps**

After successful setup:
1. Test image uploads and viewing
2. Test comments and reactions
3. Test guestbook functionality
4. Consider adding user authentication
5. Monitor usage in Supabase dashboard

## **📞 Support**

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: Create an issue in your project repository

---

**🎉 Congratulations!** Your love story website now has a real database and cloud storage!
