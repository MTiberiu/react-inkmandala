import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Book from "./pages/Book";
import Page from "./pages/Page"; // Import the single book page component
import Books from "./pages/Books";
import Pages from "./pages/Pages";
import './styles/styles.css'
import './App.css'

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books/" element={<Books />}/>
        <Route path="/books/book/:slug" element={<Book />} /> 
        <Route path="/pages/" element={<Pages />}/>
        <Route path="/pages/page/:slug" element={<Page />} />
      </Routes>
    </Router>
  );
};

export default App;
