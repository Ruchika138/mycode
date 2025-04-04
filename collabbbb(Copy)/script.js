document.addEventListener('DOMContentLoaded', function() {
    // Connect to WebSocket server
    const socket = new WebSocket('ws://localhost:8080');

    let currentDocumentId = null;
    let isLined = false;

    // DOM elements
    const blankDocOption = document.getElementById('blank-doc');
    const linedDocOption = document.getElementById('lined-doc');
    const editorModal = document.getElementById('editor-modal');
    const editor = document.getElementById('editor');
    const closeBtn = document.querySelector('.close');
    const documentTypeTitle = document.getElementById('document-type-title');
    const userCountElement = document.getElementById('user-count');

    // Open blank document
    blankDocOption.addEventListener('click', function() {
        openDocument('blank');
    });

    // Open lined document
    linedDocOption.addEventListener('click', function() {
        openDocument('lined');
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        editorModal.style.display = 'none';
        // Notify server we're leaving the document
        if (currentDocumentId) {
            socket.send(JSON.stringify({
                type: 'leave',
                docId: currentDocumentId
            }));
        }
    });

    // Handle editor changes
    editor.addEventListener('input', function() {
        if (currentDocumentId) {
            socket.send(JSON.stringify({
                type: 'edit',
                docId: currentDocumentId,
                content: editor.innerHTML
            }));
        }
    });

    // WebSocket message handling
    socket.addEventListener('message', function(event) {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'documentCreated':
                currentDocumentId = data.docId;
                editorModal.style.display = 'block';
                if (data.documentType === 'lined') {
                    editor.classList.add('lined');
                    documentTypeTitle.textContent = 'Lined Document Editor';
                } else {
                    editor.classList.remove('lined');
                    documentTypeTitle.textContent = 'Blank Document Editor';
                }
                editor.innerHTML = data.content || '';
                userCountElement.textContent = data.userCount;
                break;

            case 'update':
                if (data.docId === currentDocumentId) {
                    // Only update if the content is different to avoid cursor jumps
                    if (editor.innerHTML !== data.content) {
                        editor.innerHTML = data.content;
                    }
                    userCountElement.textContent = data.userCount;
                }
                break;
        }
    });

    function openDocument(type) {
        isLined = type === 'lined';

        // Generate a unique document ID (in a real app, this would be done server-side)
        const docId = 'doc-';

        // Send request to create/join document
        socket.send(JSON.stringify({
            type: 'create',
            docId: docId,
            documentType: type
        }));
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === editorModal) {
            editorModal.style.display = 'none';
            if (currentDocumentId) {
                socket.send(JSON.stringify({
                    type: 'leave',
                    docId: currentDocumentId
                }));
            }
        }
    });
});