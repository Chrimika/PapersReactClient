import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Modal, Form, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { FaStar, FaHeart, FaDownload, FaUserCircle } from 'react-icons/fa';
import { AiOutlineShareAlt } from 'react-icons/ai';
import StarRating from 'react-star-rating-component';
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc, arrayUnion,Timestamp,addDoc,increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './assets/css/details.css';
import logo from './assets/images/logo.jpg';
import axios from 'axios';
import { Home, Compass, Bookmark,Star,Users,Share,Download  } from 'react-feather'

const BookDetails = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [bookDetails, setBookDetails] = useState(null);
  const [authorInfo, setAuthorInfo] = useState({});
  const [reviews, setReviews] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullAuthorBio, setShowFullAuthorBio] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [paymentOption, setPaymentOption] = useState('single'); // État pour l'option de paiement
  const [isPurchased, setIsPurchased] = useState(false); // État pour vérifier si le livre a été acheté

  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const bookRef = doc(db, 'livres', bookId);
        const docSnap = await getDoc(bookRef);
        if (docSnap.exists()) {
          const bookData = docSnap.data();
          setBookDetails(bookData);
          setEpisodes(await fetchEpisodes(bookId));
          setAuthorInfo(await fetchAuthorInfo(bookData.hauteur));
          setIsFavorite(await checkFavorite(bookData.name));
  
          // Vérification si le livre a été acheté
          const user = auth.currentUser;
          if (user) {
            const purchased = await checkBookInUserPurchasedBooks(user.uid, bookData.id);
            setIsPurchased(purchased);
          }
        } else {
          setBookDetails(null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails du livre :', error);
        setError('Erreur lors de la récupération des détails du livre.');
      } finally {
        setLoading(false);
      }
    };
  
    const checkBookInUserPurchasedBooks = async (userId, bookId) => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() && userSnap.data().buyed?.includes(bookId);
        
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'achat :', error);
        return false;
      }
    };
    
  
    fetchBookDetails();
  }, [bookId, db, auth]);
  

  const fetchEpisodes = async (bookId) => {
    const episodesRef = collection(db, 'livres', bookId, 'episodes');
    const episodesSnapshot = await getDocs(episodesRef);
    return episodesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const fetchAuthorInfo = async (authorId) => {
    try {
      const authorRef = doc(db, 'auteurs', authorId);
      const authorSnap = await getDoc(authorRef);
      if (authorSnap.exists()) {
        return {
          ...authorSnap.data(),
          photoUrl: authorSnap.data().photo || '',
        };
      } else {
        return { bio: 'Biographie non disponible.', photoUrl: '', metier: 'Inconnu' };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de l\'auteur :', error);
      return { bio: 'Erreur lors de la récupération des informations de l\'auteur.', photoUrl: '', metier: 'Inconnu' };
    }
  };

  const checkFavorite = async (bookName) => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() && userSnap.data().favorites?.includes(bookName);
    }
    return false;
  };
  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const reviewsRef = collection(db, 'livres', bookId , 'revues');
        const snapshot = await getDocs(reviewsRef);
        const reviewsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          date: doc.data().date ? (doc.data().date.toDate ? doc.data().date.toDate() : new Date(doc.data().date)) : new Date()
        }));
  
        console.log(reviewsData); // Ajoute ce log pour voir les données récupérées
        setReviews(reviewsData.sort((a, b) => b.date - a.date));
      } catch (error) {
        console.error('Erreur lors de la récupération des avis :', error);
        setError('Erreur lors de la récupération des avis.');
      } finally {
        setLoadingReviews(false);
      }
    };
  
    fetchReviews();
  }, [bookId, db]);
  
  const handleFavoriteToggle = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !bookDetails) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const updatedFavorites = isFavorite
        ? userSnap.data().favorites.filter(name => name !== bookDetails.name)
        : [...(userSnap.data().favorites || []), bookDetails.name];

      await updateDoc(userRef, { favorites: updatedFavorites });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de favori :', error);
      setError('Erreur lors de la mise à jour des favoris.');
    }
  };

  const handleRatingSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !bookDetails) return;

      const newReview = { 
        user_name: user.displayName || 'Utilisateur', 
        note: rating, 
        avis: reviewText, 
        date: new Date() 
      };

      const bookRef = doc(db, 'livres', bookId);
      const bookSnap = await getDoc(bookRef);
      const updatedReviews = [...(bookSnap.data().revues || []), newReview];

      await updateDoc(bookRef, { revues: updatedReviews });
      setReviews(updatedReviews);
      setRatingModalVisible(false);
      setRating(1);
      setReviewText('');
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'avis :', error);
      setError('Erreur lors de la soumission de l\'avis.');
    }
  };
  const calculateAverageNote = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
  
    const total = reviews.reduce((sum, review) => sum + review.note, 0);
    return (total / reviews.length).toFixed(1);
  };

  const averageNote = calculateAverageNote(reviews);
  
  const handleShare = () => {
    if (bookDetails) {
      navigator.clipboard.writeText(`Découvrez ce livre : ${bookDetails.name} - ${bookDetails.coverUrl}`);
      alert('Les détails du livre ont été copiés dans le presse-papiers !');
    }
  };
  

  // Fonction de traitement des paiements
// Fonction de traitement des paiements

const BuyBook = async (book) => {
  try {
    let bookId = book.id.replace(/ /g, '_');
    console.log("ID du livre préparé pour le paiement :", bookId);
    
    const formData = new FormData();
    formData.append('email', 'papers@seeds.cm');
    formData.append('token_app', '4fda55961a3152c09d67ede0d8ae2be9');
    formData.append('montant', book.price.toString());
    formData.append('image_link', book.coverUrl);
    formData.append('description', 'Papers est une application mobile innovante pour les auteurs.');
    formData.append('pass', 'My$S3cr3t$Pap3rs'); // À éviter en production
    formData.append('success_lien', 'https://silly-babka-5c39a4.netlify.app/pages/succes.html');
    formData.append('echec_lien', 'https://silly-babka-5c39a4.netlify.app/pages/echec.html');
    formData.append('code_produit', bookId);
    formData.append('nom_produit', book.name);

    console.log("Données envoyées pour le paiement :", Object.fromEntries(formData));

    const response = await axios.post('https://www.flash.seeds.cm/flash/Service/set_payment_link', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log("Réponse reçue du serveur :", response);

    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      const data = response.data;
      console.log("Données JSON reçues :", data);

      const { lien_paiement } = data.body;
      console.log("Lien de paiement récupéré :", lien_paiement);

      const lien_paiement_base64 = btoa(lien_paiement);
      console.log("Lien de paiement encodé en base64 :", lien_paiement_base64);

      // Redirection vers le lien de paiement
      window.location.href = `https://flashsdk.seeds.cm/flash_checkout.html?d=${lien_paiement_base64}`;
      console.log("Redirection vers le lien de paiement en cours...");

    } else {
      const htmlContent = response.data;
      const newWindow = window.open();
      newWindow.document.write(htmlContent);
      console.log("Ouverture du contenu HTML dans un nouvel onglet.");
    }
  } catch (error) {
    console.error('Erreur lors de la création du lien de paiement :', error);
  }
};

// Fonction pour traiter l'achat et mettre à jour la base de données
const processPurchaseAndUpdateDB = async (book) => {
  try {
    const user = auth.currentUser; // Récupérer l'utilisateur connecté
    if (!user) {
      console.error('Utilisateur non connecté');
      return;
    }

    console.log("Mise à jour de l'utilisateur :", user.uid);

    // Référence vers le document utilisateur dans Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      buyed: arrayUnion(book.id)
    });
    console.log("Mise à jour de l'utilisateur réussie : livre ajouté à l'achat.");

    // Ajouter une nouvelle vente dans 'ventes_direct'
    await addDoc(collection(db, 'ventes_direct'), {
      user_id: user.uid,
      book_id: book.id,
      price: book.price,
      timestamp: Timestamp.now()
    });
    console.log("Vente ajoutée à 'ventes_direct' avec succès.");

    // Mettre à jour le solde de l'auteur
    const bookRef = doc(db, 'livres', book.id);
    const bookSnap = await getDoc(bookRef);
    if (bookSnap.exists()) {
      const bookData = bookSnap.data();
      const authorRef = doc(db, 'auteurs', bookData.author_id);
      await updateDoc(authorRef, {
        balance: increment(book.price)
      });
      console.log("Solde de l'auteur mis à jour avec succès.");
    } else {
      console.error("Le livre n'existe pas dans la base de données.");
    }

    // Ajouter la transaction dans la liste des transactions de l'auteur
    await addDoc(collection(db, 'auteurs', book.author_id, 'transactions'), {
      book_id: book.id,
      price: book.price,
      timestamp: Timestamp.now()
    });
    console.log("Transaction ajoutée à l'auteur avec succès.");

    await updateDatabaseAfterPurchase(book);
    console.log("Base de données mise à jour après l'achat.");

    // Gérer les modals pour le succès et l'échec
    showSuccessModal();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la base de données après l\'achat :', error);
    showErrorModal();
  }
};

// Exemples de fonctions pour afficher les modals
const showSuccessModal = () => {
  console.log('Affichage du modal de succès');
  // Implémentez le modal ici
};

const showErrorModal = () => {
  console.log('Affichage du modal d\'erreur');
  // Implémentez le modal ici
};

// Fonction pour mettre à jour la base de données après un achat
const updateDatabaseAfterPurchase = async (book) => {
  try {
    const user = auth.currentUser; // Récupérer l'utilisateur connecté
    if (!user) {
      console.error("Aucun utilisateur connecté");
      return;
    }

    console.log("Mise à jour des achats de l'utilisateur :", user.uid);

    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      purchases: arrayUnion({
        bookId: book.id,
        bookName: book.name,
        purchaseDate: new Date().toISOString(),
        amount: book.price
      })
    });

    console.log("Base de données mise à jour avec succès après l'achat.");
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la base de données après l'achat :", error);
  }
};
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
          <img src={logo} className="logo" alt="logo" />
          <Spinner animation="border" variant="primary" style={{marginTop:11}} />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('./homes')}>Retour à l'accueil</Button>
      </Container>
    );
  }

  if (!bookDetails) {
    return (
      <Container className="text-center mt-5">
        <h2 className="mb-4">Livre non trouvé</h2>
        <Button variant="primary" onClick={() => navigate('/homes')}>Retour à l'accueil</Button>
      </Container>
    );
  }

  const description = showFullDescription ? bookDetails.description || '' : bookDetails.small_summary || '';
  const authorBio = showFullAuthorBio ? authorInfo.bio || '' : (authorInfo.small_bio || '');

  return (
    <Container className="" style={{padding:0}}>
      <div style={{padding:16,backgroundColor:'#0cc0df',display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
        <img src={bookDetails.coverUrl} alt="Couverture du livre" style={{ width: '50%', height: '300px',borderRadius:10 }} />
        <div style={{justifyContent:'center',marginLeft:8}}>
          <p style={{color:'#096d98',fontWeight:'bold',width:140,fontSize:11}}>{bookDetails.genre}</p>
          <p style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: 'white',
              width: 120,
              marginVertical: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
            {bookDetails.name}
          </p>
          <p style={{width:150,fontWeight:'regular',color:'white',fontSize:14}}>{bookDetails.small_summary}</p>
          <div style={{display:'flex',flexDirection:'row',marginVertical:16,alignItems:'center'}}>
            <Star color='yellow' size={8}/>
            <p style={{marginLeft:4,fontSize:8,marginTop:15}}>{averageNote}</p>
            <Users color='white' size={8} style={{marginLeft:4}}/>
            <p style={{marginLeft:4,fontSize:8,marginTop:15}}>{reviews.length}</p>
            <Button variant="" style={{height:8,fontSize:8,marginLeft:8,display:'flex',justifyContent:'center',backgroundColor:'white'}} onClick={() => setRatingModalVisible(true)}> <p style={{marginTop:-8}}>evaluer</p> </Button>
          </div>
          <p style={{width:140,fontWeight:'bold',color:'white',marginTop:5}} numberOfLines={2}>par {authorInfo.NomPrenom}</p>

        </div>
        <div style={{alignItems:'center'}}>
            <Share size={18} color={"#fff"}/>
            <Download size={18} color={"#fff"} />
            <Bookmark size={18} color={"#fff"}/>
        </div>
      </div>

      <div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9',display:"flex", justifyContent:'space-between',padding:16,alignItems:'center'}}>
            <div>
              <p>paiement unique</p>
              <p style={{fontSize:28, marginTop:-15}}>{bookDetails.price} <span style={{fontSize:14}}>FCFA</span> </p>
            </div>
            <div>
              <Button
                  style={{backgroundColor:"#12c066",color:'white',border:'none'}}
                  className=""
                  onClick={() => BuyBook(bookDetails)}

                >
                   OBTENIR
                </Button>
            </div>
      </div>

      
      <div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9',padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:24,fontWeight:"bold"}}>séries</p>
          <Button style={{color:'#0cc0df',border:'none'}} variant="" onClick={() => setShowEpisodes(!showEpisodes)}>
              {showEpisodes ? 'Masquer les épisodes' : 'Afficher les épisodes'}
            </Button>
        </div>
       

        {showEpisodes && (
              <ListGroup className="mt-2">
                {bookDetails.episodes.map((episode, index) => (
                  <ListGroup.Item key={index}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{flex:1,display:'flex'}}>
                  <p>#{index + 1} </p>
                        <img
                          src={episode.image}
                          alt={`Épisode ${index + 1}`}
                          className="img-fluid"
                          style={{ width: 38, height: 48, borderColor: 'lightgray', borderWidth: 0.7, marginLeft: 8 }}
                        />
                        <div style={{marginLeft:16}}>
                          <h5 style={{fontSize:16,fontWeight:'bold'}}>{episode.titre}</h5>
                          <p style={{fontSize:14,width:100}}>{episode.description}</p>
                        </div>
                  </div>
                  <p style={{marginRight:'auto',marginTop:40,fontSize:8}}><small>{new Date(episode.date).toLocaleDateString()}</small></p>
                  </div>
                        

                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
      </div>

      <div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9',padding:16}}>
        <p style={{fontSize:24,fontWeight:"bold"}}>Description</p>
        {showFullDescription ? bookDetails.summary : `${bookDetails.summary?.substring(0, 150)}...`}
        <br/>
        <Button
          onClick={() => setShowFullDescription(!showFullDescription)}
          className="mb-3"
        >
          {showFullDescription ? 'Voir moins' : 'Voir plus'}
        </Button>
      </div>
      <div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9', justifyContent:'space-between',padding:16,alignItems:'center'}}>
        <p style={{fontSize:24,fontWeight:"bold"}}>Auteur</p>
        <div style={{display:'flex',padding:8,backgroundColor:'#132d59',width:'100%'}}>
        <img src={authorInfo.photoUrl} style={{width:48,height:48,borderColor:'lightgray',borderWidth:0.7,borderRadius:50}}/>
        <div style={{marginLeft:8}}>
          <p style={{fontSize:14,fontWeight:'bold',color:'white'}}>{authorInfo.NomPrenom}</p>
          <p style={{fontSize:10, color:'white',marginTop:-10}}>{authorInfo.Metier}</p>
        </div>
        </div>
        <p>{authorInfo.bio}</p>
        <Button variant="outline-primary" onClick={() => setShowFullAuthorBio(!showFullAuthorBio)}>
            {showFullAuthorBio ? 'Lire moins' : 'Lire plus'}
          </Button>
      </div>

      {/* Avis */}
      <div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9', justifyContent:'space-between',padding:16,alignItems:'center'}}>
          <h3>Avis</h3>
          {loadingReviews ? (
            <Spinner animation="border" />
          ) : (
            <ListGroup>
              {reviews.length === 0 ? (
                <ListGroup.Item className="text-center">Aucun avis disponible.</ListGroup.Item>
              ) : (
                reviews.map((review, index) => (
                  <ListGroup.Item key={index} className="mb-4 p-3 shadow-sm border rounded">
                    <div className="d-flex align-items-center">
                      {review.user_img ? (
                        <img
                          src={review.user_img}
                          alt={review.user_name}
                          className="rounded-circle me-2"
                          style={{ width: '40px', height: '40px' }}
                        />
                      ) : (
                        <FaUserCircle className="me-2" style={{ fontSize: '40px', color: '#ccc' }} />
                      )}
                      <div>
                        <h5 className="mb-1">{review.user_name}</h5>
                        <StarRating
                          name={`review-${index}`}
                          starCount={5}
                          value={review.note}
                          editing={false}
                          starColor="#FFD700"
                          emptyStarColor="#DCDCDC"
                        />
                        <p className="mt-1">{review.avis}</p>
                        <small className="text-muted">Publié le {new Date(review.date).toLocaleDateString()}</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          )}
      </div>

      <Modal show={ratingModalVisible} onHide={() => setRatingModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Évaluer le livre</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <StarRating
            name="rating"
            starCount={5}
            value={rating}
            onStarClick={(nextValue) => setRating(nextValue)}
            starColor="#FFD700"
            emptyStarColor="#DCDCDC"
          />
          <Form.Group controlId="reviewText" className="mt-3">
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Écrivez votre avis ici..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRatingModalVisible(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleRatingSubmit}>Soumettre</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BookDetails;