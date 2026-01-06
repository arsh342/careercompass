'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/ui/drawer';

const ModalContext = React.createContext<{ isMobile: boolean } | null>(null);

function useModalContext() {
	const context = React.useContext(ModalContext);
	if (!context) {
		throw new Error('Trigger or Content must be used within <Modal>');
	}
	return context;
}

type ModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultOpen?: boolean;
	children: React.ReactNode;
	dialogProps?: React.ComponentProps<typeof Dialog>;
	drawerProps?: React.ComponentProps<typeof Drawer>;
};

const Modal = ({
	dialogProps,
	open,
	onOpenChange,
	drawerProps,
	children,
}: ModalProps) => {
	const isMobile = useIsMobile();
	const Component = isMobile ? Drawer : Dialog;
	const props = isMobile ? drawerProps : dialogProps;

	return (
		<ModalContext.Provider value={{ isMobile }}>
			<Component open={open} onOpenChange={onOpenChange} {...props}>
				{children}
			</Component>
		</ModalContext.Provider>
	);
};

type ModalTriggerProps = {
	className?: string;
	children: React.ReactNode;
	asChild?: boolean;
	drawerProps?: React.ComponentProps<typeof DrawerTrigger>;
	popoverProps?: React.ComponentProps<typeof DialogTrigger>;
};

const ModalTrigger = ({
	className,
	children,
	asChild,
	drawerProps,
	popoverProps,
}: ModalTriggerProps) => {
	const { isMobile } = useModalContext();
	const Component = isMobile ? DrawerTrigger : DialogTrigger;
	const props = isMobile ? drawerProps : popoverProps;

	return (
		<Component className={className} asChild={asChild} {...props}>
			{children}
		</Component>
	);
};

type ModalCloseProps = {
	className?: string;
	children?: React.ReactNode;
	asChild?: boolean;
	drawerProps?: React.ComponentProps<typeof DrawerClose>;
	popoverProps?: React.ComponentProps<typeof DialogClose>;
};

const ModalClose = ({
	className,
	children,
	asChild,
	drawerProps,
	popoverProps,
}: ModalCloseProps) => {
	const { isMobile } = useModalContext();
	const Component = isMobile ? DrawerClose : DialogClose;
	const props = isMobile ? drawerProps : popoverProps;

	return (
		<Component className={className} asChild={asChild} {...props}>
			{children}
		</Component>
	);
};

type ModalContentProps = {
	children: React.ReactNode;
	className?: string;
	drawerProps?: React.ComponentProps<typeof DrawerContent>;
	popoverProps?: React.ComponentProps<typeof DialogContent>;
};

const ModalContent = ({
	className,
	children,
	drawerProps,
	popoverProps,
}: ModalContentProps) => {
	const { isMobile } = useModalContext();
	const Component = isMobile ? DrawerContent : DialogContent;
	const props = isMobile ? drawerProps : popoverProps;

	return (
		<Component className={className} {...props}>
			{children}
		</Component>
	);
};

const ModalHeader = ({ className, ...props }: React.ComponentProps<'div'>) => {
	const { isMobile } = useModalContext();
	const Component = isMobile ? DrawerHeader : DialogHeader;

	return <Component className={className} {...props} />;
};

type ModalTitleProps = {
	className?: string;
	children: React.ReactNode;
	drawerProps?: React.ComponentProps<typeof DrawerTitle>;
	popoverProps?: React.ComponentProps<typeof DialogTitle>;
};

const ModalTitle = ({
	className,
	children,
	drawerProps,
	popoverProps,
}: ModalTitleProps) => {
	const { isMobile } = useModalContext();
	const Component = isMobile ? DrawerTitle : DialogTitle;
	const props = isMobile ? drawerProps : popoverProps;

	return (
		<Component className={className} {...props}>
			{children}
		</Component>
	);
};

type ModalDescriptionProps = {
	className?: string;
	children: React.ReactNode;
	drawerProps?: React.ComponentProps<typeof DrawerDescription>;
	popoverProps?: React.ComponentProps<typeof DialogDescription>;
};

const ModalDescription = ({
	className,
	children,
	drawerProps,
	popoverProps,
}: ModalDescriptionProps) => {
	const { isMobile } = useModalContext();
	const Component = isMobile ? DrawerDescription : DialogDescription;
	const props = isMobile ? drawerProps : popoverProps;

	return (
		<Component className={className} {...props}>
			{children}
		</Component>
	);
};

const ModalBody = ({ className, ...props }: React.ComponentProps<'div'>) => {
	return <div className={cn('px-4 py-6', className)} {...props} />;
};

const ModalFooter = ({ className, ...props }: React.ComponentProps<'div'>) => {
	const { isMobile } = useModalContext();
	const Component = isMobile ? DrawerFooter : DialogFooter;
	return <Component className={className} {...props} />;
};

export {
	Modal,
	ModalTrigger,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
};
