export const startQRScan = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if the browser supports camera access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      reject(new Error("Camera access is not supported"));
      return;
    }

    // Create video element for camera stream
    const video = document.createElement('video');
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.zIndex = '9999';
    video.setAttribute('playsinline', 'true');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.color = 'white';
    overlay.style.fontSize = '18px';
    overlay.innerHTML = `
      <div style="border: 2px solid #FFD700; width: 250px; height: 250px; margin-bottom: 20px; border-radius: 10px;"></div>
      <p>Position QR code within the frame</p>
      <button id="qr-cancel" style="margin-top: 20px; padding: 10px 20px; background: #FF4444; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
    `;

    document.body.appendChild(video);
    document.body.appendChild(overlay);

    const cleanup = () => {
      document.body.removeChild(video);
      document.body.removeChild(overlay);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };

    // Cancel button
    const cancelButton = overlay.querySelector('#qr-cancel');
    cancelButton?.addEventListener('click', () => {
      cleanup();
      reject(new Error("QR scan cancelled"));
    });

    let stream: MediaStream;

    // Start camera
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;
      video.play();

      // Simulate QR scanning (in a real app, you'd use a QR code library)
      setTimeout(() => {
        cleanup();
        // Mock QR data - in reality this would come from a QR scanning library
        resolve("mock-profile-id-123");
      }, 3000);
    })
    .catch((error) => {
      cleanup();
      reject(new Error(`Camera access denied: ${error.message}`));
    });
  });
};

export const generateQRCode = (profileUrl: string): string => {
  // Generate QR code for the profile URL using a free QR API
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(profileUrl)}`;
};

export const generateProfileUrl = (profileId: number): string => {
  // Generate public profile URL that works for everyone
  const baseUrl = window.location.origin;
  return `${baseUrl}/profile/${profileId}`;
};
