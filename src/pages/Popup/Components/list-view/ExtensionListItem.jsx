import React, { memo, useEffect, useState } from "react"

import {
  DeleteOutlined,
  HomeOutlined,
  LockOutlined,
  SettingOutlined,
  UnlockOutlined
} from "@ant-design/icons"
import { Button, Popconfirm, Switch } from "antd"
import classNames from "classnames"

import "./ExtensionListItem.css"

import { ManualEnableCounter } from ".../storage/local/ManualEnableCounter"
import { getIcon } from ".../utils/extensionHelper.js"
import { isStringEmpty } from ".../utils/utils.js"
import { useExtensionItemPin } from "../../hooks/useExtensionItemPin"

const manualEnableCounter = new ManualEnableCounter()

/**
 * 打开扩展设置页面
 */
const handleSettingButtonClick = (e, item) => {
  chrome.tabs.create({ url: item.optionsUrl })
}

/**
 * 打开扩展主页
 */
const handleHomeButtonClick = (e, item) => {
  chrome.tabs.create({ url: item.homepageUrl })
}

/**
 * 扩展列表项
 */
const ExtensionListItem = memo(({ item, options }) => {
  const [isHover, setIsHover] = useState(false)
  const [isInteractive, setIsInteractive] = useState(false)
  const [isShowOperationButton, setIsShowOperationButton] = useState(false)

  const [itemEnable, setItemEnable] = useState(item.enabled)
  const existOptionPage = !isStringEmpty(item.optionsUrl)
  const existHomePage = !isStringEmpty(item.homepageUrl)

  // 是否在固定分组
  const [itemPined, setItemPined] = useExtensionItemPin(item, options)
  // 固定分组的小圆点
  const isShowDotOfFixedExtension = options.setting.isShowDotOfFixedExtension ?? true

  // 在切换分组可以控制扩展的开启或关闭时，这里需要主动更新 enabled，否则 UI 显示会有问题
  useEffect(() => {
    setItemEnable(item.enabled)
  }, [item])

  useEffect(() => {
    const showButtonAlways = options.setting?.isShowItemOperationAlways ?? false
    setIsShowOperationButton(showButtonAlways)
  }, [options])

  const onSwitchChange = (checked, item) => {
    chrome.management.setEnabled(item.id, checked)
    setItemEnable(checked)
    if (checked) {
      manualEnableCounter.count(item.id)
    }
  }

  const onItemMouseOver = (e) => {
    if (e.type === "mouseenter") {
      setIsHover(true)
    } else if (e.type === "mouseleave" && !isInteractive) {
      setIsHover(false)
    }
  }

  const confirmDeleteExtension = (e, item) => {
    chrome.management.uninstall(item.id)
    setIsInteractive(false)
    setIsHover(false)
  }

  const cancelDeleteExtension = (e, item) => {
    setIsInteractive(false)
    setIsHover(false)
  }

  // 如果存在别名，则显示别名
  const showName = item.__attach__?.alias ? item.__attach__?.alias : item.name

  return (
    <div
      onMouseEnter={(e) => onItemMouseOver(e)}
      onMouseLeave={(e) => onItemMouseOver(e)}
      className={classNames([
        "list-item-container",
        { "is-enable": itemEnable, "not-enable": !itemEnable }
      ])}>
      <div className="list-item-img-box">
        <img src={getIcon(item, 24)} alt="" />
        {itemPined && isShowDotOfFixedExtension && <i className="list-item-fix-dot"></i>}
      </div>

      <span className="ext-name">{showName}</span>
      {buildOperationButton(isHover || isShowOperationButton)}
    </div>
  )

  function buildOperationButton(isHover) {
    if (!isHover) {
      return null
    } else {
      return (
        <div className="li-operation">
          <Switch
            className="switch"
            size="small"
            checked={itemEnable}
            onChange={(e) => onSwitchChange(e, item)}></Switch>

          <Button
            type="text"
            icon={itemPined ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => setItemPined(!itemPined)}
          />

          <Button
            disabled={!existOptionPage}
            type="text"
            icon={<SettingOutlined />}
            onClick={(e) => handleSettingButtonClick(e, item)}
          />

          <Popconfirm
            title="移除扩展"
            description={`确认要从浏览器中移除 ${item.shortName}`}
            onConfirm={(e) => confirmDeleteExtension(e, item)}
            onCancel={(e) => cancelDeleteExtension(e, item)}
            onClick={(e) => setIsInteractive(true)}
            okText="Yes"
            cancelText="Cancel">
            <Button type="text" icon={<DeleteOutlined />} />
          </Popconfirm>

          <Button
            disabled={!existHomePage}
            type="text"
            icon={<HomeOutlined />}
            onClick={(e) => handleHomeButtonClick(e, item)}
          />
        </div>
      )
    }
  }
})

export default ExtensionListItem
