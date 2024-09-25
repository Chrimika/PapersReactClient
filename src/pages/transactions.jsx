import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Assurez-vous que le chemin est correct

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Requêtes pour récupérer les transactions triées par date
        const transactionsRef = collection(db, 'ventes_direct');
        const q = query(transactionsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des transactions :', error);
        setError('Une erreur est survenue lors de la récupération des transactions.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mt-4">
      <h2>État des Transactions</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ID Utilisateur</th>
            <th>ID Livre</th>
            <th>Prix</th>
            <th>Date</th>
            <th>État</th> {/* Ajout de la colonne pour l'état */}
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.user_id}</td>
              <td>{transaction.book_id}</td>
              <td>{transaction.price}</td>
              <td>{new Date(transaction.timestamp.toDate()).toLocaleString()}</td>
              <td>{transaction.etat}</td> {/* Affichage de l'état */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsPage;
