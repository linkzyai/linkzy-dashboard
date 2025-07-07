# Adding Your Demo Videos

## Quick Setup (2 minutes):

### Step 1: Add Your Video Files
1. Copy your **MP4** file to this `public/` folder
2. Rename it to: `demo-video.mp4`
3. Copy your **WebM** file to this `public/` folder  
4. Rename it to: `demo-video.webm`

### Step 2: File Structure Should Look Like:
```
public/
├── demo-video.mp4    ← Your MP4 file here
├── demo-video.webm   ← Your WebM file here
├── chainlink.PNG
└── other files...
```

### Step 3: Deploy to Netlify
1. Commit and push your changes to your Git repository
2. Netlify will automatically rebuild and deploy
3. Your video will be live at: `yoursite.com` (Hero section)

## The Magic ✨

Your Hero component is **already configured** to use both formats:

```html
<video autoPlay muted loop playsInline controls>
  <source src="/demo-video.webm" type="video/webm" />
  <source src="/demo-video.mp4" type="video/mp4" />
</video>
```

## Browser Support:
- **WebM**: Chrome, Firefox, Opera (smaller file size)
- **MP4**: Safari, Edge, older browsers (wider compatibility)
- **Fallback**: If videos fail, shows a play button

## Performance Tips:
- Keep videos under **5MB** for fast loading
- **30-60 seconds** is the sweet spot for demos
- Videos auto-play muted (browser requirements)

## Testing:
1. After deploying, visit your site
2. The video should appear in the Hero section
3. Click play button if needed (depends on browser)

---

**Need help?** The video component has built-in error handling and will gracefully fallback to a play button if there are any issues!