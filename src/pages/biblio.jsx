import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';  
import { useAppContext } from '../AppContext';  
import { Button, Modal, Image, ProgressBar } from 'react-bootstrap';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';  
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './assets/images/logo.jpg';

export default function Bibliothèque() {
  const { sharedState } = useAppContext();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [userFavorites, setUserFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Récupérer les informations utilisateur
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserFavorites(userDoc.data().favorites || []);
        } else {
          console.error("L'utilisateur n'existe pas dans Firestore.");
        }
      }
      setLoading(false); // Mettre à jour le chargement après avoir vérifié l'utilisateur
    });

    return () => unsubscribe();
  }, []);

  // Récupérer les livres
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksCollection = collection(db, 'livres');
        const booksSnapshot = await getDocs(booksCollection);
        setBooks(booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Erreur lors de la récupération des livres:', error);
      }
    };
    fetchBooks();
  }, []);

  // Retirer un livre des favoris
  const handleRemoveFavorite = async (bookName) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        favorites: arrayRemove(bookName)
      });
      setUserFavorites(prevFavorites => prevFavorites.filter(fav => fav !== bookName));
    }
  };

  // Vérifier l'état de chargement
  if (loading) {
    return <ProgressBar animated now={100} />;
  }

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <Image src="./assets/images/logo.jpg" className="mb-3" width={100} />
        <p>Veuillez vous connecter pour accéder à votre bibliothèque.</p>
      </div>
    );
  }

  // Filtrer les livres en fonction des favoris de l'utilisateur
  const filteredBooks = books.filter(book => userFavorites.includes(book.name));

  return (
    <div className="container mt-5"> {/* Ajout de la classe mt-5 ici */}
      <nav className="navbar navbar-expand-lg fixed-top shadow-sm mb-7">
        <a className="navbar-brand" href="/">
          <img src={logo} alt="Logo" className="rounded-circle" />
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link active" href="./homes">Accueil</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/discover">Découvrez</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/biblio">Bibliothèque</a>
            </li>
          </ul>
        </div>
      </nav>

      <header className="d-flex justify-content-between align-items-center py-3 border-bottom">
        <h1 className="h2">Bibliothèque</h1>
        <Button onClick={() => navigate('/Profile')}>
          <Image src={user.photoURL} roundedCircle width={50} height={50} />
        </Button>
      </header>

      <div className="row">
        {filteredBooks.map(book => (
          <div key={book.id} className="col-md-4 mb-4">
            <div className="card" onClick={() => { setSelectedBook(book); setModalVisible(true); }}>
              <img src={book.coverUrl} className="card-img-top" alt={book.name} />
              <div className="card-body">
                <h5 className="card-title">{book.name}</h5>
                <Button variant="danger" onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(book.name); }}>
                  Retirer des favoris
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedBook && (
        <Modal show={isModalVisible} onHide={() => setModalVisible(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedBook.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Button variant="primary" onClick={() => navigate('/PdfViewer', { state: { pdfUrl: selectedBook.pdfUrl } })}>
              Lire
            </Button>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}

