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

    struct Borrow {
        address addr;
        uint256 returnDate;
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
    mapping(string => Borrow) public borrowedBooks;

    modifier isOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    modifier isNotBorrowed(string memory _ISBN) {
        require(borrowedBooks[_ISBN].addr == address(0x0), "This book is already borrowed");
        _;
    }

    modifier hasBook(string memory _ISBN) {
        require(borrowedBooks[_ISBN].addr == msg.sender, "You are not the borrower of this book");
        _;
    }

    function addBook(Book memory b) public isOwner {
        books.push(b);
        ISBNToBookId[b.ISBN] = bookCount;
        titleToBookId[b.title] = bookCount;
        authorToBookId[b.author] = bookCount;
        bookCount++;
    }

    function borrowBook(string memory _ISBN) public isNotBorrowed(_ISBN) {
        borrowedBooks[_ISBN] = Borrow(msg.sender, block.timestamp + 3 weeks);
    }

    function returnBook(string memory _ISBN) public hasBook(_ISBN) {
        delete borrowedBooks[_ISBN];
    }

}
