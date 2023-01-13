// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Library {
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    struct Book {
        string ISBN;
        string author;
        string title;
    }
    // ISBN => Book
    mapping(string => Book) public books;
    // borrower address => Book
    mapping(address => Book) public borrowedBooks;

    function addBook(Book memory b) public {
        books[b.ISBN] = b;
    }

}
