import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

const PdfViewer = ({ location, user }) => {
  const { pdfUrl } = location.state || {};

  // Vérifier si l'utilisateur est authentifié
  if (!user) {
    return (
      <Container className="text-center">
        <Alert variant="danger">Vous devez être connecté pour accéder à ce document.</Alert>
      </Container>
    );
  }

  if (!pdfUrl) {
    return (
      <Container className="text-center">
        <Alert variant="danger">Échec du chargement du PDF.</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <div className="text-center mb-3">
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="primary">Ouvrir le PDF dans un nouvel onglet</Button>
        </a>
      </div>

      <iframe
        src={pdfUrl}
        width="100%"
        height="600px"
        style={{ border: 'none' }}
        title="PDF Viewer"
      />
      
      <p className="text-center">
        Si le PDF ne s'affiche pas, <a href={pdfUrl} target="_blank" rel="noopener noreferrer">cliquez ici pour le télécharger.</a>
      </p>
    </Container>
  );
};

export default PdfViewer;