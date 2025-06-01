'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const alice = await queryInterface.rawSelect(
      "users",
      { where: { username: "alice" }, plain: true },
      ["id"]
    );
    const aliceUserId = alice.id;
    const bob = await queryInterface.rawSelect(
      "users",
      { where: { username: "bob" }, plain: true },
      ["id"]
    );
    const bobUserId = bob.id;
    const charlie = await queryInterface.rawSelect(
      "users",
      { where: { username: "charlie" }, plain: true },
      ["id"]
    );
    const charlieUserId = charlie.id;
    const alicePost = await queryInterface.rawSelect(
      "user_posts",
      { where: { caption: "Exploring the rabbit hole. #adventure" }, plain: true },
      ["id"]
    );
    const alicesPost1UUID = alicePost.id;
    // const alicePost1 = await queryInterface.rawSelect(
    //   "user_posts",
    //   { where: { caption: "Tea party with the Mad Hatter was wild!" }, plain: true },
    //   ["id"]
    // );
    // const alicesPost2UUID = alicePost1.id;
    const bobPost = await queryInterface.rawSelect(
      "user_posts",
      { where: { caption: "Just finished building a new birdhouse! 🐦🏠" }, plain: true },
      ["id"]
    );
    const bobsPost1UUID = bobPost.id;
    // const bobPost1 = await queryInterface.rawSelect(
    //   "user_posts",
    //   { where: { caption: "My latest blueprint. #construction #design" }, plain: true },
    //   ["id"]
    // );
    // const bobsPost2UUID = bobPost1.id;
    const charliePost = await queryInterface.rawSelect(
      "user_posts",
      { where: { caption: "Trying to fly a kite again... 🪁" }, plain: true },
      ["id"]
    );
    const charliesPost1UUID = charliePost.id;
    const comment1Id = uuidv4(); 
    const comment2Id = uuidv4(); 
    const comment3Id = uuidv4(); 
    const comment4Id = uuidv4(); 
    const comment5Id = uuidv4(); 

    await queryInterface.bulkInsert('post_comments', [
      {
        id: comment1Id,
        post_id: alicesPost1UUID,     
        user_id: bobUserId,           
        text: 'Wow, Alice! Looks amazing!',
        parent_comment_id: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: comment2Id,
        post_id: alicesPost1UUID,     
        user_id: charlieUserId,       
        text: 'Be careful down there!',
        parent_comment_id: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: comment3Id,
        post_id: alicesPost1UUID,    
        user_id: aliceUserId,         
        text: 'Thanks Bob! It was quite an experience.',
        parent_comment_id: comment1Id, 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: comment4Id,
        post_id: bobsPost1UUID,      
        user_id: aliceUserId,         
        text: 'That birdhouse is so cute, Bob!',
        parent_comment_id: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: comment5Id,
        post_id: charliesPost1UUID,   
        user_id: bobUserId,           
        text: 'Need any help with that kite, Charlie?',
        parent_comment_id: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('post_comments', {
      text: [
        'Wow, Alice! Looks amazing!',
        'Be careful down there!',
        'Thanks Bob! It was quite an experience.',
        'That birdhouse is so cute, Bob!',
        'Need any help with that kite, Charlie?'
      ]
    }, {});
  }
};