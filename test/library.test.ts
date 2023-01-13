import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
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

  describe('deployment', () => {
    it('Should set the right owner', async () => {
      const { library, owner } = await loadFixture(deployLibraryFixture);
      expect(await library.owner()).to.equal(owner.address);
    });
  });

  describe('addBook', () => {
    let library: Library;

    before(async () => {
      library = (await loadFixture(deployLibraryFixture)).library;
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
      expect(res).to.equal(address);
    });

    it('Should not borrow a book that is already borrowed', async () => {
      await library
        .borrowBook(book.ISBN)
        .catch((error: Error) =>
          expect(error.message).to.equal(
            "VM Exception while processing transaction: reverted with reason string 'This book is already borrowed'"
          )
        );
    });
  });
});
