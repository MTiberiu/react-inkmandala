import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PrintProvider } from "./contexts/PrintContext";
import HomePage from "./pages/HomePage";
import Book from "./pages/Book";
import Page from "./pages/Page"; // Import the single book page component
import Books from "./pages/Books";
import Pages from "./pages/Pages";
import './styles/styles.css'
import './App.css'
import Header from "./components/Header";
import Footer from "./components/Footer";

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <PrintProvider>
        <Router>
          <div className="App">
            <Header /> {/* Afișează header-ul pe toate paginile */}
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/books/" element={<Books />} />
                <Route path="/books/book/:slug" element={<Book />} />
                <Route path="/pages/" element={<Pages />} />
                <Route path="/pages/page/:slug" element={<Page />} />
              </Routes>
            </main>
            <Footer /> {/* Afișează footer-ul pe toate paginile */}
          </div>
        </Router>
      </PrintProvider>
    </HelmetProvider>
  );
};

export default App;
