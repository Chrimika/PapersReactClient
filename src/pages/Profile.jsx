import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Image, Button, Alert, Spinner } from 'react-bootstrap';
import { auth, db } from '../firebase'; // Assurez-vous d'importer votre configuration Firebase
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { FaChevronLeft, FaHome, FaCompass, FaBookmark } from 'react-icons/fa'; // Utilisation de react-icons

const Profile = () => {
  const { sharedState, setSharedState } = useAppContext();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les informations utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUser({ id: currentUser.uid, ...userDoc.data() });
          } else {
            console.error("L'utilisateur n'existe pas dans Firestore.");
          }
        }
      } catch (err) {
        setError('Échec du chargement des données utilisateur');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSharedState((prevState) => ({ ...prevState, user: null }));
      console.log("Utilisateur déconnecté avec succès.");
      navigate('/login');
    } catch (error) {
      setError('Erreur lors de la déconnexion');
      console.error(error);
    }
  };

  // Affichage de l'indicateur de chargement
  if (loading) {
    return (
      <Container className="text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // Affichage des messages d'erreur
  if (error) {
    return (
      <Container className="text-center">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // Affichage des informations de profil utilisateur
  return (
    <Container className="my-5">
      <Row>
        <Col className="text-center">
          <Button onClick={() => navigate('/homes')} variant="link">
            <FaChevronLeft size={24} />
          </Button>
          {user && (
            <>
              <Image src={user.image} roundedCircle width={100} height={100} />
              <h2>{user.uname}</h2>
              <p>{user.adresse}</p>
              <Button variant="danger" onClick={handleLogout}>Déconnexion</Button>
            </>
          )}
        </Col>
      </Row>
      <Row className="mt-5">
        <Col className="text-center">
          <Button variant="link" onClick={() => navigate('/homes')}>
            <FaHome size={24} /> Accueil
          </Button>
        </Col>
        <Col className="text-center">
          <Button variant="link" onClick={() => navigate('/discover')}>
            <FaCompass size={24} /> Découvrez
          </Button>
        </Col>
        <Col className="text-center">
          <Button variant="link" onClick={() => navigate('/biblio')}>
            <FaBookmark size={24} /> Bibliothèque
          </Button>
        </Col>
        <Col className="text-center">
          <Button variant="link" onClick={() => navigate('/transactions')}>
            <FaBookmark size={24} /> Mes Transactions
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
