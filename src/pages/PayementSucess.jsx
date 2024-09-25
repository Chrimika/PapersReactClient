// PaymentSuccess.js
import React from 'react';
import { useLocation } from 'react-router-dom';

const PaymentSuccess = () => {
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idTrxExt = params.get('id_trx_ext');

    if (idTrxExt) {
      // Stockez l'ID de transaction dans votre base de données
      console.log('ID de transaction:', idTrxExt);
    } else {
      console.error('ID de transaction manquant');
    }
  }, [location]);

  return (
    <div>
      <h1>Paiement réussi</h1>
      <p>Merci d'avoir utilisé Flash Up !</p>
    </div>
  );
};

export default PaymentSuccess;