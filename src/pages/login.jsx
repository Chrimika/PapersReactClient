import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa'; // Importer l'icône Google
import { auth, provider } from '../firebase'; // Importer l'authentification Firebase
import { signInWithPopup } from 'firebase/auth';
import './assets/css/Login.css'; // Importer le fichier CSS

const Login = () => {
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkUser = () => {
      const user = localStorage.getItem('user');
      if (user) {
        navigate('/homes'); // Redirection si l'utilisateur est déjà connecté
      }
    };

    checkUser();
  }, [navigate]);

  // Fonction pour gérer la connexion avec Google
  const onGoogleButtonPress = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userInfo = {
        uid: user.uid,
        uname: user.displayName,
        adresse: user.email,
        image: user.photoURL,
      };

      // Enregistrer les informations utilisateur dans localStorage
      localStorage.setItem('user', JSON.stringify(userInfo));

      // Redirection après la connexion
      navigate('/homes');
    } catch (error) {
      console.error("Erreur de connexion avec Google :", error);
    }
  };

  return (
    <div className="container-fluid">
      <div className="header">
        <img
          className="header-image"
          src={require('./assets/images/header.jpg')}
          alt="Header"
        />
        <div className="gradient-overlay"></div> {/* Couche de dégradé */}
        <div className="header-content">
          <div className="logo-container">
            <img
              className="logo"
              src={require('./assets/images/logo.jpg')}
              alt="Logo"
            />
          </div>
          <div className="welcome-text">
            <h1 className="welcome-title">Bienvenue sur</h1>
            <h2 className="welcome-subtitle">Papers</h2>
          </div>
        </div>
      </div>
      <div className="button-container">
        <button className="google-button" onClick={onGoogleButtonPress}>
          <FaGoogle className="google-icon" />
          <span className="button-text">Continuer avec Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;