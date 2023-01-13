import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Library } from '../typechain-types';

describe('Library smart contract', () => {
  const deployLibraryFixture = async () => {
    const [owner, otherAccount] = await ethers.getSigners();
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();
    return { library, owner, otherAccount };
  };

  const book = {
    title: 'Harry Potter',
    author: 'J. K. Rowling',
    ISBN: 'test1',
  };

  const defaultAddress = '0x0000000000000000000000000000000000000000';

  describe('deployment', () => {
    it('Should set the right owner', async () => {
      const { library, owner } = await loadFixture(deployLibraryFixture);
      expect(await library.owner()).to.equal(owner.address);
    });
  });

  describe('addBook', () => {
    let library: Library;
    let otherAccount: SignerWithAddress;
    before(async () => {
      const contract = await loadFixture(deployLibraryFixture);
      library = contract.library;
      otherAccount = contract.otherAccount;
    });

    it('Should add a book', async () => {
      await library.addBook(book);
      const res = await library.books(0);
      const numOfBooks = await library.bookCount();

      expect(res.title).to.equal(book.title);
      expect(res.author).to.equal(book.author);
      expect(res.ISBN).to.equal(book.ISBN);
      expect(numOfBooks).to.equal(1);
    });
    it('Should not add a book if not owner', async () => {
      await expect(
        otherAccount.sendTransaction({
          to: library.address,
          data: library.interface.encodeFunctionData('addBook', [book]),
        })
      ).to.be.revertedWith('Only owner can call this function.');
    });
  });

  describe('borrowBook', () => {
    let library: Library;
    let address: string;

    before(async () => {
      const contract = await loadFixture(deployLibraryFixture);
      library = contract.library;
      address = contract.owner.address;
      await library.addBook(book);
    });

    it('Should borrow a book', async () => {
      await library.borrowBook(book.ISBN);
      const res = await library.borrowedBooks(book.ISBN);
      const d = new Date();
      d.setDate(d.getDate() + 21);

      expect(res.returnDate.toNumber() * 1000).to.approximately(
        d.getTime(),
        1000
      );
    });

    it('Should not borrow a book that is already borrowed', async () => {
      expect(library.borrowBook(book.ISBN)).to.be.revertedWith(
        'Book is already borrowed'
      );
    });
  });
  describe('returnBook', () => {
    let library: Library;
    let address: string;

    before(async () => {
      const contract = await loadFixture(deployLibraryFixture);
      library = contract.library;
      address = contract.owner.address;
      await library.addBook(book);
      await library.borrowBook(book.ISBN);
    });

    it('Should return a book', async () => {
      await library.returnBook(book.ISBN);
      const res = await library.borrowedBooks(book.ISBN);
      expect(res.returnDate.toNumber()).to.equal(0);
      expect(res.addr).to.equal(defaultAddress);
    });
  });
  describe('findAvailableBooksByTitle', () => {
    let library: Library;
    before(async () => {
      const contract = await loadFixture(deployLibraryFixture);
      library = contract.library;
      await library.addBook(book);
    });
    it('Should return an array of books', async () => {
      const res = await library.findAvailableBooksByTitle(book.title);
      expect(res.length).to.equal(1);
    });
    it('Should return an empty array if no available books are found', async () => {
      await library.borrowBook(book.ISBN);
      const res = await library.findAvailableBooksByTitle(book.title);
      expect(res[0].ISBN).to.equal('');
      expect(res[0].title).to.equal('');
      expect(res[0].author).to.equal('');
    });
  });
  describe('findBookBy...', () => {
    let library: Library;
    before(async () => {
      const contract = await loadFixture(deployLibraryFixture);
      library = contract.library;
      await library.addBook(book);
    });
    it('Should return a book by ISBN', async () => {
      const res = await library.findBookByISBN(book.ISBN);
      expect(res.ISBN).to.equal(book.ISBN);
      expect(res.title).to.equal(book.title);
      expect(res.author).to.equal(book.author);
    });
    it('Should return a book by title', async () => {
      const res = await library.findBookByTitle(book.title);
      expect(res.ISBN).to.equal(book.ISBN);
      expect(res.title).to.equal(book.title);
      expect(res.author).to.equal(book.author);
    });
    it('Should return a book by author', async () => {
      const res = await library.findBookByAuthor(book.author);
      expect(res[0].ISBN).to.equal(book.ISBN);
      expect(res[0].title).to.equal(book.title);
      expect(res[0].author).to.equal(book.author);
    });
  });
  describe('extendBorrow', () => {
    let library: Library;
    before(async () => {
      const contract = await loadFixture(deployLibraryFixture);
      library = contract.library;
      await library.addBook(book);
      await library.borrowBook(book.ISBN);
    });
    it('Should extend the borrow date', async () => {
      const borrow = await library.borrowedBooks(book.ISBN);
      await library.extendBorrow(book.ISBN);
      const res = await library.borrowedBooks(book.ISBN);
      expect(res.returnDate.toNumber()).to.be.greaterThan(
        borrow.returnDate.toNumber()
      );
      expect(res.numOfRenews).to.be.greaterThan(borrow.numOfRenews);
    });
    it('Should not extend the borrow date if the book is not borrowed', async () => {
      await library.returnBook(book.ISBN);
      expect(library.extendBorrow(book.ISBN)).to.be.revertedWith(
        'Book is not borrowed'
      );
    });
    it('Should not extend the borrow date if you have not borrowed the book', async () => {
      const book2 = { ...book, ISBN: '1234567890123' };
      expect(library.extendBorrow(book2.ISBN)).to.be.revertedWith(
        'You are not the borrower of this book'
      );
    });
    it('Should not extend the borrow date if the book has been renewed 3 times', async () => {
      const book3 = { ...book, ISBN: '1234125135656' };
      await library.addBook(book3);
      await library.borrowBook(book3.ISBN);
      for (let i = 0; i < 3; i++) {
        await library.extendBorrow(book3.ISBN);
      }
      expect(library.extendBorrow(book3.ISBN)).to.be.revertedWith(
        'You have already renewed this book 3 times'
      );
    });
  });
});
