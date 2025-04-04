const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Store documents
const documents = new Map();

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'create':
                console.log(data.docId);
                // Create or join existing document
                if (!documents.has(data.docId)) {
                    documents.set(data.docId, {
                        type: data.documentType,
                        content: '',
                        users: new Set()
                    });
                }

                const doc = documents.get(data.docId);
                doc.users.add(ws);

                // Send current document state to the new user
                ws.send(JSON.stringify({
                    type: 'documentCreated',
                    docId: data.docId,
                    documentType: doc.type,
                    content: doc.content,
                    userCount: doc.users.size
                }));

                // Notify all users about the new connection
                broadcastToDocument(data.docId, {
                    type: 'update',
                    docId: data.docId,
                    content: doc.content,
                    userCount: doc.users.size
                });
                break;

            case 'edit':
                if (documents.has(data.docId)) {
                    const doc = documents.get(data.docId);
                    doc.content = data.content;

                    // Broadcast the update to all users except the sender
                    broadcastToDocument(data.docId, {
                        type: 'update',
                        docId: data.docId,
                        content: data.content,
                        userCount: doc.users.size
                    }, ws);
                }
                break;

            case 'leave':
                if (documents.has(data.docId)) {
                    const doc = documents.get(data.docId);
                    doc.users.delete(ws);

                    if (doc.users.size === 0) {
                        // No more users - clean up (in a real app, you might want to persist the document)
                        documents.delete(data.docId);
                    } else {
                        // Notify remaining users
                        broadcastToDocument(data.docId, {
                            type: 'update',
                            docId: data.docId,
                            content: doc.content,
                            userCount: doc.users.size
                        });
                    }
                }
                break;
        }
    });

    ws.on('close', function() {
        // Clean up any document connections
        documents.forEach((doc, docId) => {
            if (doc.users.has(ws)) {
                doc.users.delete(ws);

                if (doc.users.size === 0) {
                    documents.delete(docId);
                } else {
                    broadcastToDocument(docId, {
                        type: 'update',
                        docId: docId,
                        content: doc.content,
                        userCount: doc.users.size
                    });
                }
            }
        });
    });
});

function broadcastToDocument(docId, message, excludeWs = null) {
    if (documents.has(docId)) {
        const doc = documents.get(docId);
        doc.users.forEach(client => {
            if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

console.log('WebSocket server running on ws://localhost:8080');