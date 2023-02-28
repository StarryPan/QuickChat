/*
 Navicat Premium Data Transfer

 Source Server         : 腾讯云数据库（自己）
 Source Server Type    : MySQL
 Source Server Version : 100807
 Source Host           : localhost:3306
 Source Schema         : web_quickchat

 Target Server Type    : MySQL
 Target Server Version : 100807
 File Encoding         : 65001

 Date: 28/02/2023 17:33:29
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for user_basic
-- ----------------------------
DROP TABLE IF EXISTS `user_basic`;
CREATE TABLE `user_basic`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `account` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '账号',
  `password` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '密码',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '昵称',
  `lv` int(11) UNSIGNED NULL DEFAULT 1 COMMENT '装备等级',
  `exp` int(11) NULL DEFAULT 0 COMMENT '等级经验',
  `sex` int(11) NULL DEFAULT 0 COMMENT '性别',
  `head` varchar(1024) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '头像',
  `fhead` int(11) NULL DEFAULT NULL COMMENT '头像框',
  `title` int(11) NULL DEFAULT NULL COMMENT '称号',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1 - 正常 2 - 锁定 3 - 冻结',
  `remark` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '个性签名',
  `reg_time` int(11) NOT NULL COMMENT '注册时间',
  `theme_color` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT 'indigo' COMMENT '主题颜色',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `status`(`status`) USING BTREE,
  INDEX `account`(`account`) USING BTREE,
  INDEX `password`(`password`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '用户基础信息表' ROW_FORMAT = Compact;

-- ----------------------------
-- Records of user_basic
-- ----------------------------
INSERT INTO `user_basic` VALUES (1, 'Panpan', '123456', '盼盼', 1, 0, 1, 'http://124.222.87.91:8081/static/images/heads/head2.jpg', NULL, NULL, 1, '等风来，等花开。', 1677576448, 'indigo');
INSERT INTO `user_basic` VALUES (2, 'MinMin', '123456', '小敏敏', 1, 0, 2, 'http://124.222.87.91:8081/static/images/heads/head12.jpg', NULL, NULL, 1, '可可爱爱，每天哈哈哈哈', 1677576518, 'pink');

-- ----------------------------
-- Table structure for user_chat
-- ----------------------------
DROP TABLE IF EXISTS `user_chat`;
CREATE TABLE `user_chat`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `uid` int(11) UNSIGNED NOT NULL COMMENT '用户ID',
  `chat_uid` int(11) UNSIGNED NOT NULL COMMENT '聊天对象',
  `create_time` int(11) NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `uid`(`uid`) USING BTREE,
  INDEX `chat_uid`(`chat_uid`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '用户聊天表' ROW_FORMAT = Compact;

-- ----------------------------
-- Records of user_chat
-- ----------------------------
INSERT INTO `user_chat` VALUES (1, 1, 2, 1677576565);

-- ----------------------------
-- Table structure for user_chat_mess
-- ----------------------------
DROP TABLE IF EXISTS `user_chat_mess`;
CREATE TABLE `user_chat_mess`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `uid` int(11) UNSIGNED NOT NULL COMMENT '用户ID',
  `chat_id` int(11) UNSIGNED NOT NULL COMMENT '聊天ID',
  `msg_type` int(11) UNSIGNED NOT NULL COMMENT '聊天类型',
  `state` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '0 - 未查看 1 - 已查看',
  `content` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL COMMENT '聊天内容',
  `create_time` int(11) NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `uid`(`uid`) USING BTREE,
  INDEX `state`(`state`) USING BTREE,
  INDEX `chat_id`(`chat_id`) USING BTREE,
  INDEX `msg_type`(`msg_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '用户聊天消息表' ROW_FORMAT = Compact;

-- ----------------------------
-- Records of user_chat_mess
-- ----------------------------
INSERT INTO `user_chat_mess` VALUES (1, 1, 1, 1, 1, 'hi', 1677576565);
INSERT INTO `user_chat_mess` VALUES (2, 2, 1, 7, 1, 'http://124.222.87.91:8081/static/upload/2023-02-28/file-1677576576630.webp', 1677576576);

SET FOREIGN_KEY_CHECKS = 1;
