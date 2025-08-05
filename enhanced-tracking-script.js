(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        API_BASE_URL: 'https://sljlwvrtwqmhmjunyplr.supabase.co/functions/v1',
        API_KEY: '', // Will be set via data attribute
        CHECK_INTERVAL: 30000, // Check for placement instructions every 30 seconds
        MAX_PLACEMENT_ATTEMPTS: 3,
        PLACEMENT_DELAY: 2000 // Wait 2 seconds before attempting placement
    };
    
    // Get API key from script tag
    function getAPIKey() {
        const scriptTag = document.querySelector('script[data-linkzy-api-key]');
        return scriptTag ? scriptTag.getAttribute('data-linkzy-api-key') : '';
    }
    
    // Original tracking functionality
    function trackContent() {
        const apiKey = getAPIKey();
        if (!apiKey) {
            console.warn('Linkzy: No API key found');
            return;
        }
        
        const contentData = {
            apiKey: apiKey,
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            content: extractMainContent(),
            timestamp: new Date().toISOString()
        };
        
        // Send tracking data
        fetch(`${CONFIG.API_BASE_URL}/track-content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU'
            },
            body: JSON.stringify(contentData)
        }).catch(err => console.error('Linkzy tracking failed:', err));
    }
    
    // Extract main content from page
    function extractMainContent() {
        const selectors = [
            'main', 'article', '.post-content', '.entry-content', 
            '.content', '#content', '.main-content', '.post-body'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.innerText.substring(0, 2000);
            }
        }
        
        // Fallback to body text
        return document.body.innerText.substring(0, 2000);
    }
    
    // NEW: Check for placement instructions
    async function checkForPlacementInstructions() {
        const apiKey = getAPIKey();
        if (!apiKey) return;
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get-placement-instructions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU'
                },
                body: JSON.stringify({ apiKey: apiKey })
            });
            
            const data = await response.json();
            if (data.instructions && data.instructions.length > 0) {
                for (const instruction of data.instructions) {
                    await executeBacklinkPlacement(instruction);
                }
            }
        } catch (error) {
            console.error('Linkzy: Failed to check placement instructions:', error);
        }
    }
    
    // NEW: Execute backlink placement
    async function executeBacklinkPlacement(instruction) {
        console.log('🔗 Linkzy: Executing backlink placement', instruction);
        
        try {
            // Update instruction status to 'executing'
            await updateInstructionStatus(instruction.id, 'executing');
            
            const placementData = instruction.instruction_data;
            const { targetUrl, anchorText, keywords } = placementData;
            
            // Find optimal insertion point
            const insertionPoint = findOptimalInsertionPoint(keywords);
            
            if (!insertionPoint) {
                throw new Error('No suitable insertion point found');
            }
            
            // Create the backlink element
            const link = document.createElement('a');
            link.href = targetUrl;
            link.textContent = anchorText;
            link.style.color = 'inherit';
            link.style.textDecoration = 'underline';
            link.setAttribute('rel', 'noopener');
            
            // Insert the link naturally into content
            const success = insertLinkNaturally(insertionPoint, link, anchorText);
            
            if (success) {
                // Verify placement
                const verificationSuccess = verifyLinkPlacement(targetUrl);
                
                // Report success
                await updateInstructionStatus(instruction.id, 'completed', {
                    placementUrl: window.location.href,
                    insertionMethod: insertionPoint.method,
                    verificationSuccess: verificationSuccess,
                    placementTimestamp: new Date().toISOString()
                });
                
                console.log('✅ Linkzy: Backlink placed successfully');
            } else {
                throw new Error('Failed to insert link into content');
            }
            
        } catch (error) {
            console.error('❌ Linkzy: Placement failed:', error);
            await updateInstructionStatus(instruction.id, 'failed', {
                error: error.message,
                failureTimestamp: new Date().toISOString()
            });
        }
    }
    
    // Find the best place to insert a backlink
    function findOptimalInsertionPoint(keywords) {
        const contentSelectors = [
            'main p', 'article p', '.post-content p', '.entry-content p', 
            '.content p', '#content p', '.main-content p', '.post-body p'
        ];
        
        for (const selector of contentSelectors) {
            const paragraphs = document.querySelectorAll(selector);
            
            for (const paragraph of paragraphs) {
                const text = paragraph.textContent.toLowerCase();
                const wordCount = text.split(/\s+/).length;
                
                // Look for paragraphs with relevant keywords and sufficient length
                if (wordCount >= 20 && wordCount <= 100) {
                    const keywordScore = keywords.reduce((score, keyword) => {
                        return score + (text.includes(keyword.toLowerCase()) ? 1 : 0);
                    }, 0);
                    
                    if (keywordScore > 0 || keywords.length === 0) {
                        return {
                            element: paragraph,
                            method: 'paragraph_insertion',
                            wordCount: wordCount,
                            keywordScore: keywordScore
                        };
                    }
                }
            }
        }
        
        return null;
    }
    
    // Insert link naturally into existing content
    function insertLinkNaturally(insertionPoint, linkElement, anchorText) {
        try {
            const paragraph = insertionPoint.element;
            const text = paragraph.textContent;
            
            // Find a good spot in the middle of the paragraph
            const sentences = text.split(/[.!?]+/);
            if (sentences.length < 2) return false;
            
            // Insert after the first sentence
            const insertAfter = sentences[0].length + 1;
            const beforeText = text.substring(0, insertAfter);
            const afterText = text.substring(insertAfter);
            
            // Clear the paragraph and rebuild with the link
            paragraph.innerHTML = '';
            
            // Add text before link
            const beforeSpan = document.createElement('span');
            beforeSpan.textContent = beforeText;
            paragraph.appendChild(beforeSpan);
            
            // Add contextual connector and link
            const connector = document.createElement('span');
            connector.textContent = ' For more information, see ';
            paragraph.appendChild(connector);
            paragraph.appendChild(linkElement);
            
            // Add remaining text
            const afterSpan = document.createElement('span');
            afterSpan.textContent = '.' + afterText;
            paragraph.appendChild(afterSpan);
            
            return true;
        } catch (error) {
            console.error('Link insertion failed:', error);
            return false;
        }
    }
    
    // Verify that the link was successfully placed
    function verifyLinkPlacement(targetUrl) {
        const links = document.querySelectorAll(`a[href="${targetUrl}"]`);
        return links.length > 0 && Array.from(links).some(link => link.offsetParent !== null);
    }
    
    // Update instruction status in database
    async function updateInstructionStatus(instructionId, status, result = null) {
        try {
            await fetch(`${CONFIG.API_BASE_URL}/update-placement-instruction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU'
                },
                body: JSON.stringify({
                    instructionId: instructionId,
                    status: status,
                    result: result
                })
            });
        } catch (error) {
            console.error('Failed to update instruction status:', error);
        }
    }
    
    // Initialize the enhanced tracking script
    function initialize() {
        console.log('🔗 Linkzy Enhanced Tracking Script loaded');
        
        // Track content on page load (original functionality)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', trackContent);
        } else {
            trackContent();
        }
        
        // Start checking for placement instructions
        setTimeout(() => {
            checkForPlacementInstructions();
            setInterval(checkForPlacementInstructions, CONFIG.CHECK_INTERVAL);
        }, CONFIG.PLACEMENT_DELAY);
    }
    
    // Start the script
    initialize();
    
})(); 