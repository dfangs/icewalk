import React from 'react';
import './styles.css';

import Footer from './components/Footer';
import HeaderBar from './components/HeaderBar';
import MainInterface from './components/MainInterface';

export default function App() {
  return (
    <div className="App">
      <HeaderBar />
      <MainInterface />
      <Footer />
    </div>
  );
}
