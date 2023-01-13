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
        uint numOfRenews;
        uint256 returnDate;
    }

    Book[] public books;
    uint public bookCount = 0;

    // ISBN => bookId
    mapping(string => uint) public ISBNToBookId;

    // title => bookId[]
    mapping(string => uint[]) public titleToBookId;

    // author => bookId[]
    mapping(string => uint[]) public authorToBookId;

    // ISBN => Borrow
    mapping(string => Borrow) public borrowedBooks;

    modifier isOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    modifier isNotBorrowed(string memory _ISBN) {
        require(borrowedBooks[_ISBN].addr == address(0x0), "This book is already borrowed");
        _;
    }

    modifier isBorrowed(string memory _ISBN) {
        require(borrowedBooks[_ISBN].addr != address(0x0), "This book is not borrowed");
        _;
    }

    modifier hasBook(string memory _ISBN) {
        require(borrowedBooks[_ISBN].addr == msg.sender, "You are not the borrower of this book");
        _;
    }

    function addBook(Book memory _b) public isOwner {
        books.push(_b);
        ISBNToBookId[_b.ISBN] = bookCount;
        titleToBookId[_b.title].push(bookCount);
        authorToBookId[_b.author].push(bookCount);
        bookCount++;
    }

    function borrowBook(string memory _ISBN) public isNotBorrowed(_ISBN) {
        borrowedBooks[_ISBN] = Borrow(msg.sender, 0, block.timestamp + 3 weeks);
    }

    function returnBook(string memory _ISBN) public hasBook(_ISBN) {
        delete borrowedBooks[_ISBN];
    }

    function findAvailableBooksByTitle(string memory _title) public view returns (Book[] memory) {
        uint[] memory bookIds = titleToBookId[_title];
        Book[] memory result = new Book[](bookIds.length);
        for (uint i = 0; i < bookIds.length; i++) {
            if (borrowedBooks[books[bookIds[i]].ISBN].addr == address(0x0)) {
                result[i] = books[bookIds[i]];
            }
        }
        return result;
    }

    function findBookByISBN(string memory _ISBN) public view returns (Book memory) {
        return books[ISBNToBookId[_ISBN]];
    }

    function findBookByAuthor(string memory _author) public view returns (Book memory) {
        return books[authorToBookId[_author][0]];
    }

    function findBookByTitle(string memory _title) public view returns (Book memory) {
        return books[titleToBookId[_title][0]];
    }

    function extendBorrow(string memory _ISBN) public hasBook(_ISBN) isBorrowed(_ISBN) {
        require(borrowedBooks[_ISBN].numOfRenews < 3, "You have already renewed this book 3 times");
        borrowedBooks[_ISBN].returnDate += 3 days;
        borrowedBooks[_ISBN].numOfRenews++;
    }

}
