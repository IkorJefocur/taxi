import React from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { IRootState } from '../../state'
import { configSelectors } from '../../state/config'
import HeaderNew from '../headerNew'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  configStatus: configSelectors.status(state),
})

const connector = connect(mapStateToProps)

interface IProps extends ConnectedProps<typeof connector> {}

function Layout({
  children,
  configStatus,
}: React.PropsWithChildren<IProps>) {
  return (
    <main className="layout">
      <HeaderNew key={configStatus} />
      {children}
    </main>
  )
}

export default connector(Layout)
