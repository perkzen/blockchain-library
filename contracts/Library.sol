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

    Book[] public books;
    uint public bookCount = 0;

    // ISBN => bookId
    mapping(string => uint) public ISBNToBookId;

    // title => bookId
    mapping(string => uint) public titleToBookId;

    // author => bookId
    mapping(string => uint) public authorToBookId;

    // borrower ISBN => address
    mapping(string => address) public borrowedBooks;

    modifier isNotBorrowed(string memory _ISBN) {
        require(borrowedBooks[_ISBN] == address(0x0), "This book is already borrowed");
        _;
    }

    function addBook(Book memory b) public {
        books.push(b);
        ISBNToBookId[b.ISBN] = bookCount;
        titleToBookId[b.title] = bookCount;
        authorToBookId[b.author] = bookCount;
        bookCount++;
    }

    function borrowBook(string memory _ISBN) public isNotBorrowed(_ISBN)  {
        borrowedBooks[_ISBN] = msg.sender;
    }

}
